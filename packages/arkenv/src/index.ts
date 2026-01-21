import { createEnv } from "./create-env.ts";
import { ArkEnvError } from "./errors.ts";

export type { EnvSchema } from "./create-env.ts";

const arkenv = createEnv;

export { arkenv, createEnv, ArkEnvError };
export default arkenv;
