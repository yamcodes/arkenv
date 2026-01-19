import { createRequire } from "node:module";

/**
 * Dynamically loads the ArkType validator module.
 * Provides a clear error message if the 'arktype' peer dependency is missing.
 */
export function loadArkTypeValidator() {
	const _require = (() => {
		try {
			if (typeof import.meta !== "undefined" && import.meta.url) {
				return createRequire(import.meta.url);
			}
		} catch {
			// ignore
		}
		return typeof require === "function" ? require : undefined;
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
		"./arktype.cjs",
		"../arktype.cjs",
		"./arktype/index.cjs",
		"../arktype/index.cjs",
		"./arktype",
		"../arktype",
		"./arktype/index.ts",
		"../arktype/index.ts",
	];

	let lastError: any;

	for (const path of searchPaths) {
		try {
			return _require(path);
		} catch (e: any) {
			lastError = e;

			// Check if this error is specifically about the 'arktype' package being missing.
			// If require(path) failed because of a missing 'arktype' dependency INSIDE the path,
			// the error code will be MODULE_NOT_FOUND, but the message will not mention our path.
			if (e.code === "MODULE_NOT_FOUND") {
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
	const msg = lastError?.message || "";
	// Simpler heuristic: if the code is MODULE_NOT_FOUND and the message contains 'arktype'
	// but doesn't look like a relative path error for the current try.
	const isMissingArkType =
		lastError?.code === "MODULE_NOT_FOUND" &&
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
