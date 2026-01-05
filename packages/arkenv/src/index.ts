export type { EnvSchema } from "./create-env";

import { createEnv } from "./create-env";

/**
 * `arkenv`'s main export, an alias for {@link createEnv}.
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
const arkenv = createEnv;
export default arkenv;
export { type } from "./type";
export { createEnv };
export { ArkEnvError } from "./errors";
