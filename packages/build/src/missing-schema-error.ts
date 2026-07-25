/**
 * Default relative schema locations hosts search when `schemaPath` is omitted.
 */
export const DEFAULT_SCHEMA_LOCATIONS = "src/env.ts or env.ts";

export type FormatMissingSchemaErrorOptions = {
	/**
	 * Explicit `schemaPath` that was missing.
	 * Omit to refer to {@link DEFAULT_SCHEMA_LOCATIONS}.
	 */
	schemaPath?: string;
	/**
	 * Where to set `schemaPath` (e.g. `"setupArkEnv options"`, `"ArkEnv options"`,
	 * `"plugin options"`).
	 */
	optionsHint: string;
	/**
	 * Brand prefix for the error.
	 * @default "[ArkEnv]"
	 */
	prefix?: string;
	/**
	 * Absolute paths that were checked during discovery.
	 * Appended as a `Checked paths` section when present.
	 */
	checkedPaths?: string[];
};

/**
 * Format a missing-schema error shared by host integrations.
 *
 * Owns the no-starter policy: hosts must use this helper instead of inlining
 * example `env.ts` modules in thrown errors.
 *
 * @param options Host-specific labels and optional discovery paths
 * @returns A short, actionable missing-schema error message
 */
export function formatMissingSchemaError(
	options: FormatMissingSchemaErrorOptions,
): string {
	const prefix = options.prefix ?? "[ArkEnv]";
	const location = options.schemaPath || DEFAULT_SCHEMA_LOCATIONS;
	let message = `${prefix} Could not find schema file at ${location}. Please specify 'schemaPath' in ${options.optionsHint} (or run \`arkenv init\`).`;

	if (options.checkedPaths?.length) {
		const pathsList = options.checkedPaths.map((p) => ` - ${p}`).join("\n");
		message += `\n\nChecked paths:\n${pathsList}`;
	}

	return message;
}
