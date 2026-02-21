import { createEnv } from "./create-env";

export { createEnv };
export { type } from "./arktype";
export type { ArkEnvConfig, EnvSchema } from "./create-env";
export { ArkEnvError } from "./errors";

/**
 * ArkEnv's main export, an alias for {@link createEnv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
const arkenv = createEnv;
export default arkenv;
