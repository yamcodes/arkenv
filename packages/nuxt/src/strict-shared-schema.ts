import { formatBuildError } from "@repo/log";

export const SHARED_SCHEMA_SPECIFIER = "#arkenv/shared-schema";

export const UNRESOLVED_SHARED_SCHEMA_ERROR =
	"[arkenv] Could not resolve #arkenv/shared-schema.\n" +
	"Ensure @arkenv/nuxt/module is registered in nuxt.config and env/internal/shared.ts\n" +
	"exports SharedSchema, or pass extends: [SharedSchema] explicitly.";

type GlobalStrictState = {
	__ARKENV_SHARED_SCHEMA__?: unknown;
};

/**
 * Resolve the auto-extend shared schema for strict layout.
 *
 * Prefers the Jiti validation injection on `globalThis`, then falls back to
 * the statically imported `#arkenv/shared-schema` module (aliased by the Nuxt
 * module). Never uses `node:module` / `createRequire`.
 *
 * @param importedSharedSchema The `SharedSchema` export from `#arkenv/shared-schema`
 * @returns The shared schema to pass through `extends`
 * @throws An arkenv-specific error when no usable SharedSchema is available in strict mode
 */
export function resolveStrictSharedSchema(
	importedSharedSchema: unknown,
): unknown {
	const injected = (globalThis as GlobalStrictState).__ARKENV_SHARED_SCHEMA__;
	if (injected !== undefined) {
		return injected;
	}

	if (importedSharedSchema !== undefined && importedSharedSchema !== null) {
		return importedSharedSchema;
	}

	throw new Error(UNRESOLVED_SHARED_SCHEMA_ERROR);
}

/**
 * Build the fail-fast error for a missing strict-layout `internal/shared.ts`.
 *
 * @param sharedPath The absolute path where `internal/shared.ts` was expected
 * @param baseDir The strict layout base directory
 * @returns A formatted ArkEnv build error message
 */
export function missingSharedTsError(
	sharedPath: string,
	baseDir: string,
): string {
	return formatBuildError(
		`Strict layout requires "internal/shared.ts" but it was not found at "${sharedPath}".\n` +
			`Expected strict layout structure under "${baseDir}":\n` +
			"  ├── internal/shared.ts\n" +
			"  ├── client.ts\n" +
			"  └── server.ts",
	);
}
