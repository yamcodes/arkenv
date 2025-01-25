import type { BaseRoot as TypeFunction } from "@ark/schema";
import { type } from "arktype";

/**
 * Define an environment variable schema and validate it against process.env
 * @param def - The environment variable schema
 * @returns The validated environment variable schema
 */
export const defineEnv = <const def>(def: type.validate<def, {}>) => {
	// TODO: Find a way to remove the assertion by narrowing the type in the function signature
	const schema = type(def) as TypeFunction;

	// Validate process.env
	const env = schema(process.env);

	if (env instanceof type.errors) {
		console.error("Environment validation failed:", env.summary);
		process.exit(1);
	}

	console.log("Validation passed, success!");
	// TODO: Find a way to remove the assertion
	return env as type.infer<def, {}>;
};
