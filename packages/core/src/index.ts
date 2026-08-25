import { $ } from "@repo/scope";
import {
	ArkEnvError,
	beginSchemaCapture,
	type EnvIssue,
	endSchemaCapture,
	formatIssues,
	getSchemaKeys,
	isCapturingSchema,
} from "@repo/utils";
import { arkenv } from "./arkenv";

export type { EnvIssue };
export {
	ArkEnvError,
	arkenv,
	beginSchemaCapture,
	endSchemaCapture,
	formatIssues,
	getSchemaKeys,
	isCapturingSchema,
};
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
