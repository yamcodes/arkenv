import { $ } from "@repo/scope";
import { createEnv } from "./create-env";

export { createEnv };
/**
 * Like ArkType's `type`, but with ArkEnv's extra keywords, such as:
 *
 * - `string.host` – a hostname (e.g. `"localhost"`, `"127.0.0.1"`)
 * - `number.port` – a port number (e.g. `8080`)
 *
 * See ArkType's docs for the full API:
 * https://arktype.io/docs/type-api
 */
export const type = $.type;
export type { ArkEnvConfig, EnvSchema } from "./create-env";
export { ArkEnvError } from "./errors";

/**
 * ArkEnv's main export, an alias for {@link createEnv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
const arkenv = createEnv;
export default arkenv;
