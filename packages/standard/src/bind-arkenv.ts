import type { StandardSchemaV1 } from "@repo/types";
import { arkenv as createArkEnv, type StandardEnvConfig } from "./index";

type BoundArkEnv = typeof createArkEnv;

/**
 * Bind `arkenv` to a default `toJsonSchema` converter.
 *
 * Callers can still pass `toJsonSchema` to override the bound converter.
 *
 * @param defaultToJsonSchema Converter used when the call omits `toJsonSchema`
 * @returns An `arkenv` function with the same public signature as the root export
 */
export function bindArkEnv(
	defaultToJsonSchema: NonNullable<StandardEnvConfig["toJsonSchema"]>,
): BoundArkEnv {
	function boundArkEnv<const T extends Record<string, StandardSchemaV1>>(
		def: T,
		config?: StandardEnvConfig,
	) {
		return createArkEnv(def, {
			...config,
			toJsonSchema: config?.toJsonSchema ?? defaultToJsonSchema,
		});
	}

	return boundArkEnv as BoundArkEnv;
}
