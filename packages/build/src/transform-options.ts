/**
 * Known plugin option keys used to discriminate transform-mode calls from schemas.
 */
export const TRANSFORM_OPTION_KEYS = new Set([
	"schemaPath",
	"clientPrefix",
	"logger",
	"logLevel",
	"env",
	"coerce",
	"onUndeclaredKey",
	"arrayFormat",
	"debugSecrets",
	"emptyAsUndefined",
]);

/**
 * Options for the env-module transform mode.
 *
 * @see docs/adr/0021-env-object-canonical-surface.md — transform design
 */
export type TransformOptions = {
	/**
	 * Path to the env module (`env.ts`), relative to the project root.
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
};

/** Thrown when a caller still uses the removed schema/`define` plugin signature. */
export const SCHEMA_DEFINE_REMOVED =
	'The schema/define plugin API was removed in v1. Use `arkenv()` or `arkenv({ schemaPath, clientPrefix })` and `import { env } from "./env"`.';

/**
 * Decide whether the first plugin argument is transform-mode options.
 *
 * Transform mode: `arkenv()`, `arkenv({})`, `arkenv({ schemaPath })`, or other
 * options-only bags. A schema object or a second argument is rejected.
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
 * Throw if the plugin was called with the removed schema/`define` signature.
 *
 * @param first The first argument passed to the plugin factory
 * @param second The optional second argument
 * @throws {Error} When the call is not transform-mode options
 */
export function assertTransformModeCall(
	first: unknown,
	second: unknown,
): asserts first is TransformOptions | undefined {
	if (!isTransformModeCall(first, second)) {
		throw new Error(SCHEMA_DEFINE_REMOVED);
	}
}
