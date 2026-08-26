import { toJsonSchema } from "@valibot/to-json-schema";
import { bindArkEnv } from "./bind-arkenv";
import type { StandardEnvConfig } from "./index";

const valibotToJsonSchema: NonNullable<StandardEnvConfig["toJsonSchema"]> = (
	schema,
) =>
	toJsonSchema(schema as Parameters<typeof toJsonSchema>[0], {
		typeMode: "input",
		target: "draft-07",
	});

/**
 * Parse and validate environment variables with Valibot.
 *
 * Pre-binds `@valibot/to-json-schema` (`typeMode: "input"`, `target: "draft-07"`)
 * so `v.number()` and `v.boolean()` coerce without a manual `toJsonSchema`
 * callback. Install `@valibot/to-json-schema` alongside `valibot`.
 *
 * @param def An object mapping variable names to Valibot schemas
 * @param config Optional configuration. Pass `toJsonSchema` to override the bound converter
 * @returns The validated environment variables, or a SafeArkEnvResult if `{ safe: true }` is configured
 * @throws An {@link ArkEnvError} if validation fails and `safe` is not enabled
 *
 * @example
 * ```ts
 * import { arkenv } from "@arkenv/standard/valibot";
 * import * as v from "valibot";
 *
 * const env = arkenv({
 *   PORT: v.optional(v.number(), 3000),
 *   DEBUG: v.optional(v.boolean(), false),
 * });
 * ```
 */
export const arkenv = bindArkEnv(valibotToJsonSchema);

export {
	ArkEnvError,
	type EnvIssue,
	formatIssues,
	getSchemaKeys,
	type SafeArkEnvResult,
	type StandardEnvConfig,
} from "./index";

export default arkenv;
