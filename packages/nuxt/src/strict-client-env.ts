import { createRequire } from "node:module";
import { formatBuildError } from "@repo/log";

export const CLIENT_ENV_SPECIFIER = "#arkenv/client-env";

export const UNRESOLVED_CLIENT_ENV_ERROR =
	"[arkenv] Could not resolve #arkenv/client-env.\n" +
	"Ensure @arkenv/nuxt/module is registered in nuxt.config and env/client.ts exists,\n" +
	"or pass extends: [clientEnv] explicitly.";

declare const __ARKENV_STRICT_LAYOUT__: boolean | undefined;

type GlobalStrictState = {
	__ARKENV_STRICT_LAYOUT__?: boolean;
	__ARKENV_CLIENT_ENV__?: unknown;
};

/**
 * Report whether Nuxt strict layout auto-extend is active.
 *
 * Prefers the Vite `define` flag when present; falls back to the
 * `globalThis` marker set during Jiti build-time validation.
 *
 * @returns `true` when strict-layout auto-extend should run
 */
export function isStrictLayoutActive(): boolean {
	if (
		typeof __ARKENV_STRICT_LAYOUT__ !== "undefined" &&
		__ARKENV_STRICT_LAYOUT__
	) {
		return true;
	}
	return (globalThis as GlobalStrictState).__ARKENV_STRICT_LAYOUT__ === true;
}

/**
 * Extract the `env` export from a `#arkenv/client-env` module namespace.
 *
 * @param mod The loaded module namespace or default export
 * @returns The client env object when present, otherwise the module itself
 */
function unwrapClientEnv(mod: unknown): unknown {
	if (mod && typeof mod === "object") {
		if ("env" in mod && (mod as { env: unknown }).env !== undefined) {
			return (mod as { env: unknown }).env;
		}
		const defaultExport = (mod as { default?: unknown }).default;
		if (
			defaultExport &&
			typeof defaultExport === "object" &&
			"env" in defaultExport &&
			(defaultExport as { env: unknown }).env !== undefined
		) {
			return (defaultExport as { env: unknown }).env;
		}
	}
	return mod;
}

/**
 * Load the strict-layout client env for auto-extend.
 *
 * Resolution order:
 * 1. `globalThis.__ARKENV_CLIENT_ENV__` (Jiti validation injection)
 * 2. Synchronous `require("#arkenv/client-env")` (Vite/Nitro alias)
 *
 * @returns The client env object to pass through `extends`
 * @throws An arkenv-specific error when the virtual module cannot be resolved
 */
export function loadStrictClientEnv(): unknown {
	const injected = (globalThis as GlobalStrictState).__ARKENV_CLIENT_ENV__;
	if (injected !== undefined) {
		return injected;
	}

	try {
		const req =
			typeof require === "function" ? require : createRequire(import.meta.url);
		return unwrapClientEnv(req(CLIENT_ENV_SPECIFIER));
	} catch {
		throw new Error(UNRESOLVED_CLIENT_ENV_ERROR);
	}
}

/**
 * Build the fail-fast error for a missing strict-layout `client.ts`.
 *
 * @param clientPath The absolute path where `client.ts` was expected
 * @param baseDir The strict layout base directory
 * @returns A formatted ArkEnv build error message
 */
export function missingClientTsError(
	clientPath: string,
	baseDir: string,
): string {
	return formatBuildError(
		`Strict layout requires "client.ts" but it was not found at "${clientPath}".\n` +
			`Expected strict layout structure under "${baseDir}":\n` +
			"  ├── internal/shared.ts\n" +
			"  ├── client.ts\n" +
			"  └── server.ts",
	);
}
