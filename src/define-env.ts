import type { BaseRoot as TypeFunction } from "@ark/schema";
import { type distill, type } from "arktype";
import { red } from "picocolors";
import { indent } from "./utils";

type UserEnvironment = Record<string, string | undefined>;

/**
 * Define an environment variable schema and validate it against a given environment (defaults to `process.env`)
 * @param def - The environment variable schema
 * @param env - The environment variables to validate, defaults to `process.env`
 * @returns The validated environment variable schema
 */
export const defineEnv = <const def>(
	def: type.validate<def>,
	env: UserEnvironment = process.env,
) => {
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
		throw new Error(
			`${red("Errors found while validating environment variables:")}\n${indent(
				validatedEnv.summary,
			)}\n`,
		);
	}
	// TODO: Find a way to remove the assertion
	return validatedEnv as distill.Out<type.infer<def>>;
};
