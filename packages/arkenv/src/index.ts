export type { CreateEnvOptions, EnvSchema } from "./create-env";

import { createEnv } from "./create-env";

/**
 * `arkenv`'s main export, an alias for {@link createEnv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables parser powered by {@link https://arktype.io | ArkType}, TypeScript's 1:1 validator.
 */
const arkenv = createEnv;
export default arkenv;
export { type } from "./type";
export { createEnv };
export { ArkEnvError } from "./errors";
