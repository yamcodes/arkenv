import { createEnv } from "./create-env.ts";

export { createEnv };
export type { ArkEnvConfig, EnvSchema } from "./create-env.ts";
export { ArkEnvError } from "./errors.ts";

/**
 * ArkEnv's main export, an alias for {@link createEnv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
const arkenv = createEnv;
export default arkenv;
