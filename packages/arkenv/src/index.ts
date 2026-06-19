import { $ } from "@repo/scope";
import { arkenv, safeCreateEnv } from "./arkenv.ts";
import { getSchemaKeys } from "./schema.ts";

export { arkenv, getSchemaKeys, safeCreateEnv };
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
export type {
	ArkEnvConfig,
	EnvSchema,
	Infer,
	SafeCreateEnvResult,
} from "./arkenv.ts";

/**
 * ArkEnv's main export, an alias for {@link arkenv}
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
export default arkenv;
