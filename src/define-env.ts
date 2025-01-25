import type { BaseRoot as TypeFunction } from "@ark/schema";
import { type distill, type } from "arktype";

/**
 * Define an environment variable schema and validate it against process.env
 * @param def - The environment variable schema
 * @returns The validated environment variable schema
 */
export const defineEnv = <const def>(def: type.validate<def, {}>) => {
	// TODO: Find a way to remove the assertion by narrowing the type in the function signature
	const schema = type(def) as TypeFunction;

	// Validate process.env
    const requiredEnvKeys = Object.keys(def as Record<string, unknown>);
    const filteredEnvVars = Object.fromEntries(
        Object.entries(process.env)
        .filter(([key]) => requiredEnvKeys.includes(key))
    );
	const validatedEnv = schema(filteredEnvVars);

	if (validatedEnv instanceof type.errors) {
		console.error("Environment validation failed:", validatedEnv.summary);
		process.exit(1);
	}

	console.log("Validation passed, success!");
	// TODO: Find a way to remove the assertion
	return validatedEnv as distill.Out<type.infer<def>>;
};
