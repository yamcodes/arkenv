export type { EnvSchema, ArkEnvConfig } from "./create-env";

import { arkenv } from "./create-env";

/**
 * `arkenv`'s main export, an alias for {@link createEnv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
export default arkenv;
export { type } from "./type";
export { arkenv, createEnv, defineEnv } from "./create-env";
export { ArkEnvError } from "./errors";
