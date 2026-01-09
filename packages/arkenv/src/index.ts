import { arkenv, createEnv } from "./create-env";

export type { EnvSchema } from "./create-env";

/**
 * `arkenv`'s primary entry point.
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
export default arkenv;
export { arkenv, createEnv };
export { ArkEnvError } from "./errors";
export { type } from "./type";
