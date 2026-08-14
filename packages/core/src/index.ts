import { $ } from "@repo/scope";
import {
	ArkEnvValidationError,
	type EnvIssue,
	formatIssues,
	getSchemaKeys,
} from "@repo/utils";
import { arkenv } from "./arkenv";

export type { EnvIssue };
export { ArkEnvValidationError, arkenv, formatIssues, getSchemaKeys };
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
	SafeArkEnvResult,
} from "./arkenv";

export default arkenv;
