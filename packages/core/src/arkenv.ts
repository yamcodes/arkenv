import type { $ } from "@repo/scope";
import type {
	CompiledEnvSchema,
	InferType,
	SchemaShape,
	StandardSchemaV1,
} from "@repo/types";
import type { SafeArkEnvResult } from "@repo/utils";
import type { type as at, distill, Type } from "arktype";
import { parse } from "./arktype";

/**
 * Declarative environment schema definition accepted by ArkEnv.
 *
 * Maps environment variable names to schema definitions (e.g. ArkType DSL
 * strings or Standard Schema validators).
 *
 * @template def - The schema shape object
 */
export type EnvSchema<def> = at.validate<def, $>;

/**
 * Infer the validated and coerced environment object type from a schema.
 * Supports declarative schema shapes, compiled ArkType schemas, and Standard Schema validators.
 *
 * @template T - The schema type
 */
export type Infer<T> =
	T extends StandardSchemaV1<infer _Input, infer Output>
		? Output
		: T extends { t: infer U }
			? U
			: T extends Type<infer U, any>
				? U
				: T extends SchemaShape
					? distill.Out<at.infer<T, $>>
					: InferType<T>;

/**
 * Configuration options for `arkenv`
 */
export type ArkEnvConfig = {
	/**
	 * The environment variables to parse. Defaults to `process.env`.
	 *
	 * All values must be strings (or `undefined`) to match `process.env` semantics.
	 */
	env?: Record<string, string | undefined>;
	/**
	 * Whether to coerce environment variables to their defined types. Defaults to `true`
	 */
	coerce?: boolean;
	/**
	 * Control how ArkEnv handles environment variables that are not defined in your schema.
	 *
	 * Defaults to `'delete'` so the output object only contains keys you've declared.
	 *
	 * - `delete` (default): Undeclared keys are allowed on input but stripped from the output.
	 * - `ignore`: Undeclared keys are allowed and preserved in the output.
	 * - `reject`: Undeclared keys will cause validation to fail.
	 *
	 * @default "delete"
	 * @see https://arktype.io/docs/configuration#onundeclaredkey
	 */
	onUndeclaredKey?: "ignore" | "delete" | "reject";

	/**
	 * The format to use for array parsing when coercion is enabled.
	 *
	 * - `comma` (default): Strings are split by comma and trimmed.
	 * - `json`: Strings are parsed as JSON.
	 *
	 * @default "comma"
	 */
	arrayFormat?: "comma" | "json";

	/**
	 * Whether to bypass secret redaction and print raw sensitive values during debugging.
	 * Defaults to checking `process.env.ARKENV_DEBUG_SECRETS === "true"` or `"1"`.
	 */
	debugSecrets?: boolean;

	/**
	 * Whether to treat empty strings (`""`) as `undefined` before validation.
	 *
	 * When enabled, an environment variable set to an empty value (e.g. `PORT=`)
	 * will be treated as if it were missing, allowing defaults to apply and
	 * preventing validation errors for numeric or boolean types.
	 *
	 * @default false
	 */
	emptyAsUndefined?: boolean;

	/**
	 * Reserved for call-site compat. Pass `false` or omit.
	 * Use `tryArkenv` from `@arkenv/core/safe` instead of `{ safe: true }`.
	 *
	 * @default false
	 */
	safe?: false;
};

export type { SafeArkEnvResult };

/**
 * Parsed environment object inferred from an EnvSchema or CompiledEnvSchema.
 */
export type ArkenvOutput<T extends SchemaShape, D> =
	| distill.Out<at.infer<T, $>>
	| InferType<D>;

const SCHEMA_CAPTURE_KEY = Symbol.for("arkenv.schemaCapture.v1");

type SchemaCaptureBag = {
	capturing: boolean;
	definitions: unknown[];
};

/**
 * Record `def` on the CLI schema-capture bag if capture is active.
 *
 * @param def The schema definition passed to `arkenv()`
 * @returns `true` when capture consumed the call
 */
function recordIfCapturing(def: unknown): boolean {
	const state = (
		globalThis as typeof globalThis & {
			[SCHEMA_CAPTURE_KEY]?: SchemaCaptureBag;
		}
	)[SCHEMA_CAPTURE_KEY];
	if (!state?.capturing) {
		return false;
	}
	state.definitions.push(def);
	return true;
}

/**
 * Parse and validate environment variables using ArkType or Standard Schema.
 *
 * @param def The schema definition
 * @param config The evaluation configuration
 * @returns The parsed environment variables, or a value-less stub when schema capture is active
 * @throws An ArkEnvError if the environment variables are invalid
 */
export function arkenv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, $>>;
export function arkenv<T extends CompiledEnvSchema>(
	def: T,
	config?: ArkEnvConfig,
): InferType<T>;
export function arkenv<
	const T extends SchemaShape,
	const D extends EnvSchema<T> | CompiledEnvSchema,
>(def: D, config?: ArkEnvConfig): ArkenvOutput<T, D>;
export function arkenv<
	const T extends SchemaShape,
	const D extends EnvSchema<T> | CompiledEnvSchema,
>(def: D, config: ArkEnvConfig = {}): ArkenvOutput<T, D> {
	if (recordIfCapturing(def)) {
		// Capture records the schema only. The returned object has no values, so
		// schema modules must stay declarative and must not require env at module scope.
		return {} as ArkenvOutput<T, D>;
	}
	// biome-ignore lint/suspicious/noExplicitAny: parse handles both EnvSchema<T> and CompiledEnvSchema at runtime
	return parse(def as any, config);
}
