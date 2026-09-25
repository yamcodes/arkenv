/**
 * Known plugin option keys used to discriminate transform-mode calls from schemas.
 *
 * Runtime validation fields (`coerce`, `onUndeclaredKey`, and the rest of
 * {@link RUNTIME_ONLY_OPTION_KEYS}) are intentionally absent. Those belong on
 * `arkenv()` in `env.ts`.
 */
export const TRANSFORM_OPTION_KEYS = new Set([
	"schemaPath",
	"clientPrefix",
	"logger",
	"logLevel",
	"env",
]);

/**
 * Runtime `arkenv()` fields that bundler plugins must not accept.
 *
 * Mirrors the validation options on `ArkEnvConfig` / `StandardEnvConfig`
 * other than `env`, which stays as a build-time override.
 */
export const RUNTIME_ONLY_OPTION_KEYS = new Set([
	"onUndeclaredKey",
	"coerce",
	"toJsonSchema",
	"arrayFormat",
	"emptyAsUndefined",
	"debugSecrets",
]);

/**
 * Options for the env-module transform mode.
 */
export type TransformOptions = {
	/**
	 * Path to the env module file (`env.ts`), relative to the project root.
	 *
	 * When omitted, ArkEnv auto-discovers `src/env.ts` or `env.ts`.
	 */
	schemaPath?: string;
	/**
	 * Prefix(es) that mark client-exposed environment variables.
	 *
	 * Defaults to framework-specific prefix (e.g. `"VITE_"` or `"BUN_PUBLIC_"`).
	 */
	clientPrefix?: string | string[];
	/**
	 * Build-time environment override merged over the loaded environment
	 * before the schema module is evaluated.
	 *
	 * This is not the runtime parse source. `env` on `arkenv()` in `env.ts`
	 * still selects which record that call validates.
	 *
	 * All values must be strings (or `undefined`) to match `process.env` semantics.
	 */
	env?: Record<string, string | undefined>;
};

/** Thrown when a caller still uses the removed schema/`define` plugin signature. */
export const SCHEMA_DEFINE_REMOVED =
	'The schema/define plugin API was removed in v1. Use `arkenv()` or `arkenv({ schemaPath, clientPrefix })` and `import { env } from "./env"`.';

/**
 * Build the error for runtime validation keys passed to a bundler plugin.
 *
 * @param keys Runtime-only option names found on the plugin argument
 * @returns The error message naming those keys
 */
export function pluginOptionNotSupportedMessage(
	keys: readonly string[],
): string {
	const listed = keys.map((key) => `\`${key}\``).join(", ");
	const verb = keys.length === 1 ? "is" : "are";
	return `${listed} ${verb} not a plugin option. Set runtime validation options on \`arkenv()\` in \`env.ts\`.`;
}

/**
 * Decide whether the first plugin argument is transform-mode options.
 *
 * Transform mode: `arkenv()`, `arkenv({})`, `arkenv({ schemaPath })`, or other
 * options-only bags (`clientPrefix`, `logger`, `logLevel`, `env`). A schema
 * object, a runtime-only validation key, or a second argument is rejected.
 *
 * @param first The first argument passed to the plugin factory
 * @param second The optional second argument (legacy schema/`define` config)
 * @returns Whether the call is transform-mode options
 */
export function isTransformModeCall(
	first: unknown,
	second: unknown,
): first is TransformOptions | undefined {
	if (second !== undefined) return false;
	if (first === undefined) return true;
	if (typeof first !== "object" || first === null) return false;
	const keys = Object.keys(first);
	if (keys.length === 0) return true;
	return keys.every((key) => TRANSFORM_OPTION_KEYS.has(key));
}

/**
 * Return runtime-only option names present on a plugin argument.
 *
 * @param value The first argument passed to the plugin factory
 * @returns Matching keys, in enumeration order
 */
function runtimeOnlyOptionKeys(value: unknown): string[] {
	if (typeof value !== "object" || value === null) return [];
	return Object.keys(value).filter((key) => RUNTIME_ONLY_OPTION_KEYS.has(key));
}

/**
 * Throw if the plugin was called with a runtime validation option or the removed schema/`define` signature.
 *
 * A single-argument bag that includes `coerce`, `toJsonSchema`, or another
 * {@link RUNTIME_ONLY_OPTION_KEYS} entry is rejected as not a plugin option.
 * A schema map or a second argument still uses the removed schema/`define` error.
 *
 * @param first The first argument passed to the plugin factory
 * @param second The optional second argument
 * @throws When a runtime-only key is passed as a plugin option
 * @throws When the call is not transform-mode options
 */
export function assertTransformModeCall(
	first: unknown,
	second: unknown,
): asserts first is TransformOptions | undefined {
	if (isTransformModeCall(first, second)) return;

	if (second === undefined) {
		const runtimeKeys = runtimeOnlyOptionKeys(first);
		if (runtimeKeys.length > 0) {
			throw new Error(pluginOptionNotSupportedMessage(runtimeKeys));
		}
	}

	throw new Error(SCHEMA_DEFINE_REMOVED);
}
