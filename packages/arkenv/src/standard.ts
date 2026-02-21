import type { StandardSchemaV1 } from "@repo/types";
import {
	assertNotArkTypeDsl,
	assertStandardSchema,
	assertStandardSchemaMap,
} from "./guards";
import { type ParseStandardConfig, parseStandard } from "./parse-standard";

/**
 * Configuration options for the `arkenv/standard` entry's `createEnv`.
 */
export type StandardEnvConfig = ParseStandardConfig;

/**
 * Parse and validate environment variables using Standard Schema 1.0 validators (e.g. Zod, Valibot).
 *
 * This entry is ArkType-free - ArkType is never imported, even transitively.
 * Use this when your project must not depend on ArkType.
 *
 * @param def - An object mapping variable names to Standard Schema validators
 * @param config - Optional configuration
 * @returns The validated environment variables
 * @throws An {@link ArkEnvError} if validation fails
 *
 * @example
 * ```ts
 * import { createEnv } from "arkenv/standard";
 * import { z } from "zod";
 *
 * const env = createEnv({
 *   PORT: z.coerce.number(),
 *   HOST: z.string(),
 * });
 * ```
 */
export function createEnv<const T extends Record<string, StandardSchemaV1>>(
	def: T,
	config?: StandardEnvConfig,
): { [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> } {
	assertStandardSchemaMap(def);

	for (const key in def) {
		const validator = (def as Record<string, unknown>)[key];
		assertNotArkTypeDsl(key, validator);
		assertStandardSchema(key, validator);
	}

	return parseStandard(def as Record<string, unknown>, config ?? {}) as {
		[K in keyof T]: StandardSchemaV1.InferOutput<T[K]>;
	};
}
