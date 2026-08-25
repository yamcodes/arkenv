import { toJSONSchema } from "zod/mini";
import { bindArkEnv } from "./bind-arkenv";
import type { StandardEnvConfig } from "./index";

const zodMiniToJsonSchema: NonNullable<StandardEnvConfig["toJsonSchema"]> = (
	schema,
) =>
	toJSONSchema(schema as unknown as Parameters<typeof toJSONSchema>[0], {
		io: "input",
		target: "draft-07",
	});

/**
 * Parse and validate environment variables with Zod Mini.
 *
 * Pre-binds `zod/mini`'s `toJSONSchema` helper (`io: "input"`, `target: "draft-07"`)
 * so Mini `z.number()` and `z.boolean()` coerce without a manual `toJsonSchema`
 * callback. Classic Zod should keep using `@arkenv/standard`.
 *
 * @param def An object mapping variable names to Zod Mini schemas
 * @param config Optional configuration. Pass `toJsonSchema` to override the bound converter
 * @returns The validated environment variables, or a SafeArkEnvResult if `{ safe: true }` is configured
 * @throws An {@link ArkEnvError} if validation fails and `safe` is not enabled
 *
 * @example
 * ```ts
 * import { arkenv } from "@arkenv/standard/zod-mini";
 * import * as z from "zod/mini";
 *
 * const env = arkenv({
 *   PORT: z.number(),
 *   DEBUG: z.boolean(),
 * });
 * ```
 */
export const arkenv = bindArkEnv(zodMiniToJsonSchema);

export {
	ArkEnvError,
	type EnvIssue,
	formatIssues,
	getSchemaKeys,
	type SafeArkEnvResult,
	type StandardEnvConfig,
} from "./index";

export default arkenv;
