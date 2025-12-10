import { $ } from "@repo/scope";
import type { EnvSchemaWithType, InferType, SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { coerce } from "./coerce";
import { ArkEnvError } from "./errors";
import { type } from "./type";

export type EnvSchema<def> = at.validate<def, (typeof $)["t"]>;
type RuntimeEnvironment = Record<string, string | undefined>;

/**
 * TODO: `SchemaShape` is basically `Record<string, unknown>`.
 * If possible, find a better type than "const T extends Record<string, unknown>",
 * and be as close as possible to the type accepted by ArkType's `type`.
 */

/**
 * Create an environment variables object from a schema and an environment
 * @param def - The environment variable schema (raw object or type definition created with `type()`)
 * @param env - The environment variables to validate, defaults to `process.env`
 * @returns The validated environment variable schema
 * @throws An {@link ArkEnvError | error} if the environment variables are invalid.
 */
export function createEnv<T extends EnvSchemaWithType>(
	def: T,
	env?: RuntimeEnvironment,
): InferType<T>;
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	env?: RuntimeEnvironment,
): distill.Out<at.infer<T, (typeof $)["t"]>>;
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T> | EnvSchemaWithType,
	env?: RuntimeEnvironment,
): distill.Out<at.infer<T, (typeof $)["t"]>> | InferType<typeof def>;
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T> | EnvSchemaWithType,
	env: RuntimeEnvironment = process.env,
): distill.Out<at.infer<T, (typeof $)["t"]>> | InferType<typeof def> {
	// If def is a type definition (has assert method), use it directly
	// Otherwise, use raw() to convert the schema definition
	const isCompiledType = typeof def === "function" && "assert" in def;
	const schema = isCompiledType ? def : $.type.raw(def as EnvSchema<T>);

	// Coerce values if we have a raw definition
	// We can't easily inspect compiled types to know which fields to coerce
	const coercedEnv = !isCompiledType
		? coerce(def as Record<string, unknown>, env)
		: env;

	const validatedEnv = schema(coercedEnv);

	if (validatedEnv instanceof type.errors) {
		throw new ArkEnvError(validatedEnv);
	}

	return validatedEnv;
}
