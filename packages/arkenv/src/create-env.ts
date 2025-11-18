import { type distill, type } from "arktype";
import { ArkEnvError } from "./errors";
import { $ } from "./scope";

type RuntimeEnvironment = Record<string, string | undefined>;

export type EnvSchema<def> = type.validate<def, (typeof $)["t"]>;

/**
 * Extract the inferred type from an ArkType type definition by checking its call signature
 * When a type definition is called, it returns either the validated value or type.errors
 */
type InferType<T> = T extends (
	value: Record<string, string | undefined>,
) => infer R
	? R extends type.errors
		? never
		: R
	: T extends type.Any<infer U, infer _Scope>
		? U
		: never;

/**
 * TODO: If possible, find a better type than "const T extends Record<string, unknown>",
 * and be as close as possible to the type accepted by ArkType's `type`.
 */

/**
 * Create an environment variables object from a schema and an environment
 * @param def - The environment variable schema (raw object or type definition created with `type()`)
 * @param env - The environment variables to validate, defaults to `process.env`
 * @returns The validated environment variable schema
 * @throws An {@link ArkEnvError | error} if the environment variables are invalid.
 */
export function createEnv<const T extends Record<string, unknown>>(
	def: EnvSchema<T>,
	env?: RuntimeEnvironment,
): distill.Out<type.infer<T, (typeof $)["t"]>>;
export function createEnv<T extends type.Any>(
	def: T,
	env?: RuntimeEnvironment,
): InferType<T>;
export function createEnv<const T extends Record<string, unknown>>(
	def: EnvSchema<T> | type.Any,
	env: RuntimeEnvironment = process.env,
): distill.Out<type.infer<T, (typeof $)["t"]>> | InferType<typeof def> {
	// If def is a type definition (has assert method), use it directly
	// Otherwise, use raw() to convert the schema definition
	const schema =
		typeof def === "function" && "assert" in def
			? def
			: $.type.raw(def as EnvSchema<T>);

	const validatedEnv = schema(env);

	if (validatedEnv instanceof type.errors) {
		throw new ArkEnvError(validatedEnv);
	}

	return validatedEnv;
}
