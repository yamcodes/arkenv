import type { $ } from "@repo/scope";
import type {
	CompiledEnvSchema,
	Dict,
	InferType,
	SchemaShape,
	StandardSchemaV1,
} from "@repo/types";
import { ArkEnvError, type SafeArkEnvResult, safeExecute } from "@repo/utils";
import type { type as at, distill } from "arktype";
import { parse } from "./arktype";

/**
 * Declarative environment schema definition accepted by ArkEnv.
 *
 * Represents a declarative schema object mapping environment
 * variable names to schema definitions (e.g. ArkType DSL strings
 * or Standard Schema validators).
 *
 * This type is used to validate that a schema object is compatible with
 * ArkEnv’s validator scope before being compiled or parsed.
 *
 * Most users will provide schemas in this form.
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
			: T extends at.Any<infer U, infer _Scope>
				? U
				: T extends SchemaShape
					? distill.Out<at.infer<T, $>>
					: InferType<T>;

/**
 * The environment variables passed to `arkenv`.
 * Uses `Dict<string>` to enforce
 * compile-time safety: all input environment variables must be strings
 * (or undefined), matching `process.env` semantics.
 */
type RuntimeEnvironment = Dict<string>;

/**
 * Configuration options for `arkenv`
 */
export type ArkEnvConfig = {
	/**
	 * The environment variables to parse. Defaults to `process.env`
	 */
	env?: RuntimeEnvironment;
	/**
	 * Whether to coerce environment variables to their defined types. Defaults to `true`
	 */
	coerce?: boolean;
	/**
	 * Control how ArkEnv handles environment variables that are not defined in your schema.
	 *
	 * Defaults to `'delete'` to ensure your output object only contains
	 * keys you've explicitly declared. This differs from ArkType's standard behavior, which
	 * mirrors TypeScript by defaulting to `'ignore'`.
	 *
	 * - `delete` (ArkEnv default): Undeclared keys are allowed on input but stripped from the output.
	 * - `ignore` (ArkType default): Undeclared keys are allowed and preserved in the output.
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
	 * Whether to return a safe result object instead of throwing an error on validation failure.
	 *
	 * When enabled, the function returns an object with `{ success: true, data }` or `{ success: false, issues }`.
	 *
	 * @default false
	 */
	safe?: boolean;
};

export type { SafeArkEnvResult };

/**
 * Helper type to represent the output of parsing either an EnvSchema or CompiledEnvSchema.
 */
export type ArkenvOutput<T extends SchemaShape, D> =
	| distill.Out<at.infer<T, $>>
	| InferType<D>;

/**
 * Utility to parse environment variables using ArkType or Standard Schema
 *
 * Naming convention: the main function is lowercase (`arkenv`) following the
 * JavaScript convention for functions (e.g. `zod`, `joi`). Classes and types
 * use PascalCase with the full product name (`ArkEnvError`, `SafeArkEnvResult`).
 *
 * @param def The schema definition
 * @param config The evaluation configuration
 * @returns The parsed environment variables, or a SafeArkEnvResult if `{ safe: true }` is configured
 * @throws An {@link ArkEnvError | error} if the environment variables are invalid and `safe` is not enabled
 */
export function arkenv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config?: ArkEnvConfig & { safe?: false },
): distill.Out<at.infer<T, $>>;
export function arkenv<T extends CompiledEnvSchema>(
	def: T,
	config?: ArkEnvConfig & { safe?: false },
): InferType<T>;
export function arkenv<
	const T extends SchemaShape,
	const D extends EnvSchema<T> | CompiledEnvSchema,
>(def: D, config?: ArkEnvConfig & { safe?: false }): ArkenvOutput<T, D>;
export function arkenv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config: ArkEnvConfig & { safe: true },
): SafeArkEnvResult<distill.Out<at.infer<T, $>>>;
export function arkenv<T extends CompiledEnvSchema>(
	def: T,
	config: ArkEnvConfig & { safe: true },
): SafeArkEnvResult<InferType<T>>;
export function arkenv<
	const T extends SchemaShape,
	const D extends EnvSchema<T> | CompiledEnvSchema,
>(
	def: D,
	config: ArkEnvConfig & { safe: true },
): SafeArkEnvResult<ArkenvOutput<T, D>>;
export function arkenv<
	const T extends SchemaShape,
	const D extends EnvSchema<T> | CompiledEnvSchema,
>(
	def: D,
	config: ArkEnvConfig = {},
): ArkenvOutput<T, D> | SafeArkEnvResult<ArkenvOutput<T, D>> {
	if (config.safe) {
		return safeExecute(() => parse(def as any, config));
	}
	// biome-ignore lint/suspicious/noExplicitAny: parse handles both EnvSchema<T> and CompiledEnvSchema at runtime
	return parse(def as any, config);
}
