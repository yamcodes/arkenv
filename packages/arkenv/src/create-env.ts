import type { InferType } from "@repo/types";
import { type distill, type } from "arktype";
import { coerce } from "./coerce";
import { ArkEnvError } from "./errors";
import { $ } from "./scope";

type RuntimeEnvironment = Record<string, string | undefined>;

export type EnvSchema<def> = type.validate<def, (typeof $)["t"]>;

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
	env?: RuntimeEnvironment,
): distill.Out<type.infer<T, (typeof $)["t"]>> | InferType<typeof def>;
export function createEnv<const T extends Record<string, unknown>>(
	def: EnvSchema<T> | type.Any,
	env: RuntimeEnvironment = process.env,
): distill.Out<type.infer<T, (typeof $)["t"]>> | InferType<typeof def> {
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
