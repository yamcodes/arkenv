import type { BaseRoot as TypeFunction } from "@ark/schema";
import { type distill, type } from "arktype";
import { ArkEnvError } from "./errors";

type UserEnvironment = Record<string, string | undefined>;

export type EnvSchema<
	T extends Record<string, string | undefined> = Record<
		string,
		string | undefined
	>,
> = type.validate<T>;

/**
 * Define an environment variable schema and validate it against a given environment (defaults to `process.env`)
 * @param def - The environment variable schema
 * @param env - The environment variables to validate, defaults to `process.env`
 * @returns The validated environment variable schema
 */
export const createEnv = <const T extends Record<string, string | undefined>>(
	def: EnvSchema<T>,
	env: UserEnvironment = process.env,
): distill.Out<type.infer<T>> => {
	// TODO: Find a way to remove the assertion by narrowing the type in the function signature
	const schema = type(def) as TypeFunction;

	// Validate the environment variables
	const requiredEnvKeys = Object.keys(
		def as unknown as Record<string, unknown>,
	);
	const filteredEnvVars = Object.fromEntries(
		Object.entries(env).filter(([key]) => requiredEnvKeys.includes(key)),
	);
	const validatedEnv = schema(filteredEnvVars);

	if (validatedEnv instanceof type.errors) {
		throw new ArkEnvError(validatedEnv);
	}

	// TODO: Find a way to remove the assertion
	return validatedEnv as distill.Out<type.infer<T>>;
};
