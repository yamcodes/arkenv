import type { $ } from "@repo/scope";
import type {
	CompiledEnvSchema,
	Dict,
	InferType,
	SchemaShape,
} from "@repo/types";
import type { type as at, distill } from "arktype";
import { parse } from "@/arktype/index";
import { ArkEnvError } from "@/core";

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
export type Infer<T> = T extends SchemaShape
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
};

/**
 * The result structure returned by `safeArkenv`.
 */
export type SafeArkenvResult<T> =
	| { success: true; data: T }
	| { success: false; error: ArkEnvError };

/**
 * Utility to parse environment variables using ArkType or Standard Schema
 * @param def - The schema definition
 * @param config - The evaluation configuration
 * @returns The parsed environment variables
 * @throws An {@link ArkEnvError | error} if the environment variables are invalid.
 */
export function arkenv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, $>>;
export function arkenv<T extends CompiledEnvSchema>(
	def: T,
	config?: ArkEnvConfig,
): InferType<T>;
export function arkenv<const T extends SchemaShape>(
	def: EnvSchema<T> | CompiledEnvSchema,
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, $>> | InferType<typeof def>;
export function arkenv<const T extends SchemaShape>(
	def: EnvSchema<T> | CompiledEnvSchema,
	config: ArkEnvConfig = {},
): distill.Out<at.infer<T, $>> | InferType<typeof def> {
	// biome-ignore lint/suspicious/noExplicitAny: parse handles both EnvSchema<T> and CompiledEnvSchema at runtime
	return parse(def as any, config);
}

/**
 * Non-throwing utility to parse environment variables using ArkType or Standard Schema.
 * Returns a serializable result object containing either the validated data or error issues.
 *
 * @param def - The schema definition
 * @param config - The evaluation configuration
 * @returns The SafeArkenvResult containing the data or the validation error object
 */
export function safeArkenv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config?: ArkEnvConfig,
): SafeArkenvResult<distill.Out<at.infer<T, $>>>;
export function safeArkenv<T extends CompiledEnvSchema>(
	def: T,
	config?: ArkEnvConfig,
): SafeArkenvResult<InferType<T>>;
export function safeArkenv<const T extends SchemaShape>(
	def: EnvSchema<T> | CompiledEnvSchema,
	config?: ArkEnvConfig,
): SafeArkenvResult<distill.Out<at.infer<T, $>> | InferType<typeof def>>;
export function safeArkenv<const T extends SchemaShape>(
	def: EnvSchema<T> | CompiledEnvSchema,
	config: ArkEnvConfig = {},
): SafeArkenvResult<distill.Out<at.infer<T, $>> | InferType<typeof def>> {
	try {
		const data = arkenv(def as any, config);
		return { success: true, data };
	} catch (error) {
		if (error instanceof ArkEnvError) {
			return { success: false, error };
		}
		throw error;
	}
}
