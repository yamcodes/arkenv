import { $ } from "@repo/scope";
import type { EnvSchemaWithType, InferType, SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { ArkEnvError } from "./errors";
import { type } from "./type";
import { coerce } from "./utils";

export type EnvSchema<def> = at.validate<def, $>;
type RuntimeEnvironment = Record<string, string | undefined>;

/**
 * TODO: `SchemaShape` is basically `Record<string, unknown>`.
 * If possible, find a better type than "const T extends Record<string, unknown>",
 * and be as close as possible to the type accepted by ArkType's `type`.
 */

export type ArkEnvOptions = {
	coerce?: boolean;
};

/**
 * Create an environment variables object from a schema and an environment
 * @param def - The environment variable schema (raw object or type definition created with `type()`)
 * @param envOrRef - The environment variables to validate (defaults to `process.env`) or options
 * @param opts - Options for the environment variables parser
 * @returns The validated environment variable schema
 * @throws An {@link ArkEnvError | error} if the environment variables are invalid.
 */
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	options?: ArkEnvOptions,
): distill.Out<at.infer<T, $>>;
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	env: RuntimeEnvironment,
	options?: ArkEnvOptions,
): distill.Out<at.infer<T, $>>;
export function createEnv<T extends EnvSchemaWithType>(
	def: T,
	options?: ArkEnvOptions,
): InferType<T>;
export function createEnv<T extends EnvSchemaWithType>(
	def: T,
	env: RuntimeEnvironment,
	options?: ArkEnvOptions,
): InferType<T>;
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T> | EnvSchemaWithType,
	envOrOptions: RuntimeEnvironment | ArkEnvOptions = process.env,
	options?: ArkEnvOptions,
): distill.Out<at.infer<T, $>> | InferType<typeof def> {
	// Resolve overloaded arguments
	let env: RuntimeEnvironment = process.env;
	let opts: ArkEnvOptions = {};

	if (options) {
		env = envOrOptions as RuntimeEnvironment;
		opts = options;
	} else if (isOptions(envOrOptions)) {
		opts = envOrOptions;
	} else {
		env = envOrOptions as RuntimeEnvironment;
	}

	const { coerce: shouldCoerce = true } = opts;

	// If def is a type definition (has assert method), use it directly
	// Otherwise, use raw() to convert the schema definition
	const isCompiledType = typeof def === "function" && "assert" in def;
	let schema = isCompiledType ? def : $.type.raw(def as EnvSchema<T>);

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

function isOptions(
	val: RuntimeEnvironment | ArkEnvOptions,
): val is ArkEnvOptions {
	return (
		typeof val === "object" &&
		val !== null &&
		"coerce" in val &&
		typeof (val as ArkEnvOptions).coerce === "boolean"
	);
}
