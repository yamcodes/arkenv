import { createEnv } from "./create-env";

export type { EnvSchema } from "./create-env";

/**
 * `arkenv`'s main export, an alias for {@link createEnv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
export default arkenv;
export { arkenv, createEnv } from "./create-env";
export { ArkEnvError } from "./errors";
export { type } from "./type";
