import type { EnvIssue } from "@repo/utils";
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
 * Stable inspect failure codes for {@link SchemaLoaderPort.load}.
 *
 * Protocol envelopes still use dotted `CLI.*` codes; these identify the
 * inspect failure mode so commands can choose hints and next actions.
 */
export const SCHEMA_LOAD_ERROR_CODES = {
	ERR_INSPECT_NO_CALL: "ERR_INSPECT_NO_CALL",
	ERR_INSPECT_UNSUPPORTED: "ERR_INSPECT_UNSUPPORTED",
	ERR_INSPECT_UNEXTRACTABLE: "ERR_INSPECT_UNEXTRACTABLE",
	ERR_INSPECT_EVAL_THROW: "ERR_INSPECT_EVAL_THROW",
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

export type SchemaValidationSuccess = {
	ok: true;
};

export type SchemaValidationFailure =
	| {
			ok: false;
			kind: "validation";
			message: string;
			issues: EnvIssue[];
	  }
	| {
			ok: false;
			kind: "load";
			code: SchemaLoadErrorCode;
			message: string;
			cause?: unknown;
	  };

export type SchemaValidationResult =
	| SchemaValidationSuccess
	| SchemaValidationFailure;

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

	/**
	 * Validate a resolved environment dictionary against the schema module.
	 *
	 * @param target The schema module to load and evaluate
	 * @param env The resolved environment dictionary to validate
	 * @returns Success or discriminated validation / load failure
	 */
	validate(
		target: SchemaLoadTarget,
		env: Record<string, string | undefined>,
	): Promise<SchemaValidationResult>;
};
