import { createEnv } from "./create-env.ts";

export type { EnvSchema } from "./create-env.ts";

/**
 * `arkenv`'s main export, an alias for {@link createEnv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
const arkenv = createEnv;
export default arkenv;
export { type } from "./type.ts";
export { createEnv };
export { ArkEnvError } from "./errors.ts";
