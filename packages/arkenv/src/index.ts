import { createEnv } from "./create-env.ts";
import { ArkEnvError } from "./errors.ts";

export { createEnv };
export type { ArkEnvConfig, EnvSchema } from "./create-env.ts";
export { ArkEnvError } from "./errors.ts";

const arkenv = createEnv;

export { arkenv, createEnv, ArkEnvError };
export default arkenv;
