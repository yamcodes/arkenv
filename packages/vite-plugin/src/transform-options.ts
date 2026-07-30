/** Known plugin option keys used to discriminate transform-mode calls from schemas. */
const TRANSFORM_OPTION_KEYS = new Set([
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
 * Options for the Vite plugin's env-module transform mode.
 *
 * @see docs/adr/0015-env-object-canonical-surface.md (on `dev`) — transform design
 */
export type ViteTransformOptions = {
	/**
	 * Path to the env module (`env.ts`), relative to the Vite project root.
	 *
	 * When omitted, ArkEnv auto-discovers `src/env.ts` or `env.ts`.
	 */
	schemaPath?: string;
	/**
	 * Prefix(es) that mark client-exposed environment variables.
	 *
	 * Defaults to Vite's `envPrefix` (typically `"VITE_"`).
	 */
	clientPrefix?: string | string[];
};

/**
 * Decide whether the first plugin argument selects transform mode.
 *
 * Transform mode: `arkenv()`, `arkenv({ schemaPath })`, or options-only bags.
 * Schema/`define` path: `arkenv(schema)` / `arkenv(schema, config)` — including `arkenv({})`.
 *
 * @param first The first argument passed to the plugin factory
 * @param second The optional second (schema-path config) argument
 * @returns Whether the call should enable env-module transform mode
 */
export function isTransformModeCall(
	first: unknown,
	second: unknown,
): first is ViteTransformOptions | undefined {
	if (second !== undefined) return false;
	if (first === undefined) return true;
	if (typeof first !== "object" || first === null) return false;
	const keys = Object.keys(first);
	if (keys.length === 0) return false;
	return keys.every((key) => TRANSFORM_OPTION_KEYS.has(key));
}
