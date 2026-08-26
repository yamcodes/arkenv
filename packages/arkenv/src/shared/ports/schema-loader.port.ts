import type { DeclaredSchemaKey } from "@/features/schema-loader";

/**
 * Input for {@link SchemaLoaderPort.load}.
 */
export type SchemaLoadTarget = {
	/**
	 * Absolute path to a flat-layout schema module (`env.ts`)
	 */
	schemaPath: string;
};

/**
 * Stable codes for structured schema-loader failures.
 */
export const SCHEMA_LOAD_ERROR_CODES = {
	MODULE_LOAD_FAILED: "MODULE_LOAD_FAILED",
	NO_SCHEMA: "NO_SCHEMA",
} as const;

export type SchemaLoadErrorCode =
	(typeof SCHEMA_LOAD_ERROR_CODES)[keyof typeof SCHEMA_LOAD_ERROR_CODES];

export type SchemaLoadSuccess = {
	ok: true;
	/**
	 * Declared keys in schema declaration order.
	 *
	 * An empty array means `arkenv({})` was captured — a valid empty schema,
	 * not a loader failure.
	 */
	keys: DeclaredSchemaKey[];
	/**
	 * Combined map of key name to per-key schema
	 */
	schema: Record<string, unknown>;
};

export type SchemaLoadFailure = {
	ok: false;
	code: SchemaLoadErrorCode;
	message: string;
	cause?: unknown;
};

export type SchemaLoadResult = SchemaLoadSuccess | SchemaLoadFailure;

/**
 * Load a user's schema module and return declared keys without validating env.
 */
export type SchemaLoaderPort = {
	/**
	 * Import `target.schemaPath` and inspect its `arkenv()` definition.
	 *
	 * Capture does not populate env values. The schema module should stay
	 * declarative. The installed `@arkenv/core` / `@arkenv/standard` must
	 * include schema-capture support.
	 *
	 * @param target The schema module to load
	 * @returns A discriminated success or structured error result
	 */
	load(target: SchemaLoadTarget): Promise<SchemaLoadResult>;
};
