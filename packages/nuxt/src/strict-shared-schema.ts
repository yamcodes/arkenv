export const SHARED_SCHEMA_SPECIFIER = "#arkenv/shared-schema";

export const UNRESOLVED_SHARED_SCHEMA_ERROR =
	"[arkenv] Could not resolve #arkenv/shared-schema.\n" +
	"Ensure @arkenv/nuxt/module is registered in nuxt.config. When present,\n" +
	"env/internal/shared.ts must export SharedSchema, or pass extends: [SharedSchema] explicitly.";

type GlobalStrictState = {
	__ARKENV_SHARED_SCHEMA__?: unknown;
};

/**
 * Resolve the auto-extend shared schema for strict layout.
 *
 * Prefers the Jiti validation injection on `globalThis`, then falls back to
 * the statically imported `#arkenv/shared-schema` module (aliased by the Nuxt
 * module to the project file or `empty-shared-schema` when absent). Never uses
 * `node:module` / `createRequire`.
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
