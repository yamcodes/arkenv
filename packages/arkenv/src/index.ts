import { createEnv } from "./create-env";

/**
 * Type representing a valid environment variable schema definition.
 *
 * This type validates that your schema definition is compatible with ArkEnv's environment variable parsing.
 * Schemas can be plain objects with string definitions or compiled ArkType types.
 *
 * @see {@link createEnv} for usage examples
 */
export type { EnvSchema } from "./create-env";

/**
 * `arkenv`'s main export, an alias for {@link createEnv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
const arkenv = createEnv;
export default arkenv;

/**
 * A re-export of ArkType's `type` function scoped with ArkEnv's built-in validators.
 *
 * Use this to define environment variable schemas with built-in types like `host`, `port`, `url`, and `email`,
 * or create your own custom type definitions.
 *
 * @see {@link https://arktype.io/docs | ArkType Documentation}
 */
export { type } from "./type";

/**
 * Create an environment variables object from a schema and validate it.
 *
 * This function validates environment variables against a provided schema and returns a typesafe object
 * with the parsed values. Throws an {@link ArkEnvError} if validation fails.
 *
 * @see {@link https://arkenv.js.org | ArkEnv Documentation}
 */
export { createEnv };

/**
 * Error thrown when environment variable validation fails.
 *
 * Provides formatted error messages that clearly indicate which environment variables are invalid and why.
 */
export { ArkEnvError } from "./errors";
