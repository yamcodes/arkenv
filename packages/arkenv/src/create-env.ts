import { $ } from "@repo/scope";
import type { EnvSchemaWithType, InferType, SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { ArkEnvError } from "./errors";
import { type } from "./type";
import { coerce } from "./utils";

export type EnvSchema<def> = at.validate<def, $>;
type RuntimeEnvironment = Record<string, string | undefined>;

/**
 * Configuration options for `createEnv`
 */
export type ArkEnvConfig = {
	/**
	 * The environment variables to validate. Defaults to `process.env`
	 */
	env?: RuntimeEnvironment;
	/**
	 * Whether to coerce environment variables to their defined types. Defaults to `true`
	 */
	coerce?: boolean;
	/**
	 * By default, ArkEnv will delete undeclared keys from the environment variables object.
	 * This means that variables that are present in the environment but not present in the schema cannot make their way to your code.
	 *
	 * Traditionally, however, ArkType mirrors TypeScript and defaults to deleting undeclared keys during validation.
	 *
	 * You can opt-in to this behavior and more by setting the `onUndeclaredKey` option to one of:
	 * - "ignore": Allow undeclared keys on input, preserve them on output (ArkType default)
	 * - "delete": Allow undeclared keys on input, delete them before returning output (ArkEnv default)
	 * - "reject": Reject input with undeclared keys
	 *
	 * @default "delete"
	 * @see https://arktype.io/docs/configuration#onundeclaredkey
	 */
	onUndeclaredKey?: "ignore" | "delete" | "reject";
};

/**
 * TODO: `SchemaShape` is basically `Record<string, unknown>`.
 * If possible, find a better type than "const T extends Record<string, unknown>",
 * and be as close as possible to the type accepted by ArkType's `type`.
 */

/**
 * Create an environment variables object from a schema and an environment
 * @param def - The environment variable schema (raw object or type definition created with `type()`)
 * @param config - Configuration options, see {@link ArkEnvConfig}
 * @returns The validated environment variable schema
 * @throws An {@link ArkEnvError | error} if the environment variables are invalid.
 */
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, $>>;
export function createEnv<T extends EnvSchemaWithType>(
	def: T,
	config?: ArkEnvConfig,
): InferType<T>;
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T> | EnvSchemaWithType,
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, $>> | InferType<typeof def>;
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T> | EnvSchemaWithType,
	{
		env = process.env,
		coerce: shouldCoerce = true,
		onUndeclaredKey = "delete",
	}: ArkEnvConfig = {},
): distill.Out<at.infer<T, $>> | InferType<typeof def> {
	// If def is a type definition (has assert method), use it directly
	// Otherwise, use raw() to convert the schema definition
	const isCompiledType = typeof def === "function" && "assert" in def;
	let schema = isCompiledType ? def : $.type.raw(def as EnvSchema<T>);

	// Apply the `onUndeclaredKey` option
	schema = schema.onUndeclaredKey(onUndeclaredKey);

	// Apply coercion transformation to allow strings to be parsed as numbers/booleans
	if (shouldCoerce) {
		schema = coerce(schema);
	}

	// Validate the environment variables
	const validatedEnv = schema(env);

	if (validatedEnv instanceof type.errors) {
		throw new ArkEnvError(validatedEnv);
	}

	return validatedEnv;
}
