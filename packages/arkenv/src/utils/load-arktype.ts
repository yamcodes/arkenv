import { createRequire } from "node:module";

/**
 * An object that looks like an Error, containing at least a message and optionally a code.
 */
type ErrorLike = {
	message: string;
	code?: string;
};

function isErrorLike(error: unknown): error is ErrorLike {
	return (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof (error as Record<string, unknown>).message === "string"
	);
}

/**
 * Dynamically loads the ArkType validator module.
 * Provides a clear error message if the 'arktype' peer dependency is missing.
 */
export function loadArkTypeValidator() {
	const _require = (() => {
		try {
			// 1. ESM: Try to use import.meta.url
			// biome-ignore lint/suspicious/noExplicitAny: import.meta is not fully typed
			const meta = import.meta as any;
			if (meta?.url) {
				return createRequire(meta.url);
			}
		} catch {
			// ignore
		}

		try {
			// 2. CommonJS: Use module.require if available
			// This is safer than eval and respects the local module scope.
			// biome-ignore lint/suspicious/noExplicitAny: module is a global in CJS
			const m = typeof module !== "undefined" ? (module as any) : undefined;
			if (m?.require) {
				return m.require.bind(m);
			}
		} catch {
			// ignore
		}

		try {
			// 3. Generic Node: Try to use createRequire with the current directory
			// This works in both ESM and CJS if node:module is available.
			return createRequire(`${process.cwd()}/index.js`);
		} catch {
			// ignore
		}

		return undefined;
	})();

	if (!_require) {
		throw new Error(
			"ArkEnv was unable to load the ArkType validator because neither 'createRequire' " +
				"nor 'require' are available in this environment.",
		);
	}

	// We try multiple paths to support both source execution (src/utils/load-arktype.ts)
	// and bundled execution (dist/index.js or dist/index.cjs where this is inlined).
	const searchPaths = [
		"arkenv/arktype",
		"./arktype.cjs",
		"../arktype.cjs",
		"./arktype/index.cjs",
		"../arktype/index.cjs",
		"./arktype",
		"../arktype",
		"./arktype/index.ts",
		"../arktype/index.ts",
	];

	let lastError: unknown;

	for (const path of searchPaths) {
		try {
			return _require(path);
		} catch (e) {
			lastError = e;

			if (isErrorLike(e) && e.code === "MODULE_NOT_FOUND") {
				const msg = e.message || "";
				// Nested failure: The error is about 'arktype' (the package) but we were trying to load a relative path.
				const isNestedArkTypeFailure =
					(msg.includes("'arktype'") ||
						msg.includes('"arktype"') ||
						msg.includes("Cannot find module 'arktype'")) &&
					!msg.includes(path);

				if (isNestedArkTypeFailure) {
					break;
				}
			}
		}
	}

	// If we reach here, either we searched all paths and none worked,
	// or we broke early because of a missing peer dependency.
	const msg = isErrorLike(lastError) ? lastError.message : "";
	// Simpler heuristic: if the code is MODULE_NOT_FOUND and the message contains 'arktype'
	// but doesn't look like a relative path error for the current try.
	const isMissingArkType =
		isErrorLike(lastError) &&
		lastError.code === "MODULE_NOT_FOUND" &&
		(msg.includes("'arktype'") ||
			msg.includes('"arktype"') ||
			msg.includes("Cannot find module 'arktype'")) &&
		!msg.includes("./arktype") &&
		!msg.includes("../arktype");

	if (isMissingArkType) {
		throw new Error(
			"The 'arktype' package is required when using the default validator mode. " +
				"Please install it (npm install arktype) or set 'validator: \"standard\"' in your config " +
				"if you only intend to use Standard Schema validators (like Zod or Valibot).",
		);
	}

	// If it's some other error (like a syntax error in the validator), propagate it
	throw lastError;
}
