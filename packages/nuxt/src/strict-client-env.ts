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
 * Resolve the auto-extend client env for strict layout.
 *
 * Prefers the Jiti validation injection on `globalThis`, then falls back to
 * the statically imported `#arkenv/client-env` module (aliased by the Nuxt
 * module). Never uses `node:module` / `createRequire`.
 *
 * @param importedClientEnv The `env` export from `#arkenv/client-env`
 * @returns The client env object to pass through `extends`
 * @throws An arkenv-specific error when no client env is available in strict mode
 */
export function resolveStrictClientEnv(importedClientEnv: unknown): unknown {
	const injected = (globalThis as GlobalStrictState).__ARKENV_CLIENT_ENV__;
	if (injected !== undefined) {
		return injected;
	}

	if (importedClientEnv !== undefined && importedClientEnv !== null) {
		return importedClientEnv;
	}

	throw new Error(UNRESOLVED_CLIENT_ENV_ERROR);
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
