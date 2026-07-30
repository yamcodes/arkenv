import {
	type HostPreset,
	lookupPresetField,
	type PresetField,
} from "@/features/scaffold/presets";

/**
 * Dialect-owned field lines and wrappers for schema template generation.
 *
 * Dialects supply field formatting and import/wrapper differences.
 * Layout assemblers own framework structure (Vite/Bun comments, Next/Nuxt
 * flat/nested, vanilla arkenv calls).
 */
export type Dialect = {
	/** Extra import for codegen layouts, e.g. `import { z } from "zod";`. */
	extraImport?: string;

	/**
	 * Format a schema field for strict (3-file) layouts.
	 *
	 * @param key Environment variable name
	 * @param role Field scope within the strict layout
	 * @param clientPrefix Framework client prefix for preset field lookup
	 * @param hostPreset Active hosting preset for scoped field metadata lookup
	 * @returns Field line without leading indentation (trailing comma)
	 */
	formatStrictField(
		key: string,
		role: "client" | "server" | "shared",
		clientPrefix?: string,
		hostPreset?: HostPreset,
	): string;

	/**
	 * Format a field for codegen flat/nested layouts (single-file Next/Nuxt).
	 *
	 * Unlike {@link formatStrictField}, PORT and similar keys stay as optional
	 * strings - only `shared` (NODE_ENV) uses a richer type.
	 *
	 * @param key Environment variable name
	 * @param role Field scope within the codegen layout
	 * @param clientPrefix Framework client prefix for preset field lookup
	 * @param hostPreset Active hosting preset for scoped field metadata lookup
	 * @returns Field line without leading indentation (trailing comma)
	 */
	formatCodegenField(
		key: string,
		role: "client" | "server" | "shared",
		clientPrefix?: string,
		hostPreset?: HostPreset,
	): string;

	/**
	 * Default field lines for Env-only / vanilla simple schemas when no keys
	 * are provided. Includes leading `\t\t` indentation.
	 */
	defaultSimpleSchemaFields: string;

	/**
	 * Format simple-schema field lines from explicit keys (leading `\t\t`).
	 *
	 * @param keys Environment variable keys
	 * @param clientPrefix Framework client prefix for preset field lookup
	 * @param hostPreset Active hosting preset for scoped field metadata lookup
	 * @returns Joined field lines
	 */
	formatSimpleSchemaFields(
		keys: string[],
		clientPrefix?: string,
		hostPreset?: HostPreset,
	): string;

	/**
	 * Render an optional string field value (no key, no trailing comma).
	 *
	 * Used when compiling {@link PresetField} `string` kinds.
	 *
	 * @returns Validator-specific optional string schema fragment
	 */
	formatOptionalString(): string;

	/**
	 * Render an optional enum field value (no key, no trailing comma).
	 *
	 * Used when compiling {@link PresetField} `enum` kinds.
	 *
	 * @param values Allowed enum members
	 * @returns Validator-specific optional enum schema fragment
	 */
	formatOptionalEnum(values: readonly string[]): string;

	/**
	 * Default strict-layout fields when no env keys are provided.
	 *
	 * @param clientPrefix Framework client prefix (`NEXT_PUBLIC_` / `NUXT_PUBLIC_`)
	 */
	getDefaultStrictFields(clientPrefix: string): {
		serverFields: string[];
		clientFields: string[];
		sharedFields: string[];
		runtimeEnvFields: string[];
	};

	/**
	 * Default codegen-layout field lines (with `\t\t` indent) when no keys.
	 *
	 * @param clientPrefix Framework client prefix
	 */
	getDefaultCodegenFields(clientPrefix: string): {
		serverFields: string[];
		clientFields: string[];
		sharedFields: string[];
	};

	/** Import block for the strict shared schema file. */
	sharedImports: string;

	/**
	 * Wrap a formatted object literal as the SharedSchema value.
	 *
	 * @param schemaObject Object literal from {@link formatSchemaObject}
	 */
	wrapSharedSchema(schemaObject: string): string;

	/**
	 * Extra imports for strict client/server files (after the arkenv import).
	 * Empty for arktype; zod/valibot add their package import.
	 */
	strictExtraImports: string;

	/**
	 * Assemble a vanilla (runtime arkenv) single-file template body.
	 *
	 * @param schemaFields Field lines with `\t\t` indentation
	 * @returns Full file content without trailing newline
	 */
	assembleVanilla(schemaFields: string): string;

	/**
	 * Imports used by Vite/Bun Env-only templates (schema export, no arkenv call).
	 */
	pluginEnvImports: string;
};

/**
 * Compile a {@link PresetField} into a dialect-specific schema value fragment.
 *
 * @param dialect Dialect providing optional string/enum renderers
 * @param field Preset field metadata
 * @returns Schema value without key or trailing comma
 */
export function formatPresetFieldValue(
	dialect: Pick<Dialect, "formatOptionalString" | "formatOptionalEnum">,
	field: PresetField,
): string {
	if (field.type === "string") {
		return dialect.formatOptionalString();
	}
	return dialect.formatOptionalEnum(field.values);
}

/**
 * Resolve a key to a preset-backed schema value when metadata exists.
 *
 * @param dialect Dialect providing optional string/enum renderers
 * @param key Environment variable name
 * @param clientPrefix Framework client prefix
 * @param hostPreset Active hosting preset for scoped field metadata lookup
 * @returns Schema value fragment, or `undefined` when the key is not a preset field
 */
export function tryFormatPresetFieldValue(
	dialect: Pick<Dialect, "formatOptionalString" | "formatOptionalEnum">,
	key: string,
	clientPrefix: string,
	hostPreset?: HostPreset,
): string | undefined {
	const field = lookupPresetField(key, clientPrefix, hostPreset);
	if (!field) return undefined;
	return formatPresetFieldValue(dialect, field);
}

export type { HostPreset };
