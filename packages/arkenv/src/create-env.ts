import { type distill, type } from "arktype";
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
 * @param def - The environment variable schema
 * @param env - The environment variables to validate, defaults to `process.env`
 * @returns The validated environment variable schema
 * @throws An {@link ArkEnvError | error} if the environment variables are invalid.
 */
export function createEnv<const T extends Record<string, unknown>>(
	def: EnvSchema<T>,
	env: RuntimeEnvironment = process.env,
): distill.Out<type.infer<T, (typeof $)["t"]>> {
	const schema = $.type.raw(def);

	const validatedEnv = schema(env);

	if (validatedEnv instanceof type.errors) {
		throw new ArkEnvError(validatedEnv);
	}

	return validatedEnv;
}
