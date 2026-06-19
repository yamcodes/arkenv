import type { StandardSchemaV1 } from "@repo/types";
import { ArkEnvError, type SafeArkEnvResult } from "./core";
import {
	assertNotArkTypeDsl,
	assertStandardSchema,
	assertStandardSchemaMap,
} from "./guards";
import { type ParseStandardConfig, parseStandard } from "./parse-standard";
import { executeSafe } from "./utils/errors";

/**
 * Configuration options for the `arkenv/standard` entry's `arkenv`.
 */
export type StandardEnvConfig = ParseStandardConfig;

/**
 * Parse and validate environment variables using Standard Schema 1.0 validators (e.g. Zod, Valibot).
 *
 * This entry is ArkType-free - ArkType is never imported, even transitively.
 * Use this when your project must not depend on ArkType.
 *
 * @param def An object mapping variable names to Standard Schema validators
 * @param config Optional configuration
 * @returns The validated environment variables
 * @throws An {@link ArkEnvError} if validation fails
 *
 * @example
 * ```ts
 * import arkenv from "arkenv/standard";
 * import { z } from "zod";
 *
 * const env = arkenv({
 *   PORT: z.coerce.number(),
 *   HOST: z.string(),
 * });
 * ```
 */
export function arkenv<const T extends Record<string, StandardSchemaV1>>(
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

/**
 * Non-throwing standard mode utility to parse and validate environment variables using Standard Schema 1.0 validators.
 * Returns a serializable result object containing either the validated data or error issues.
 *
 * @param def - An object mapping variable names to Standard Schema validators
 * @param config - Optional configuration
 * @returns The SafeArkenvResult containing the data or the validation error object
 */
export function safeArkEnv<const T extends Record<string, StandardSchemaV1>>(
	def: T,
	config?: StandardEnvConfig,
): SafeArkEnvResult<{ [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> }> {
	return executeSafe(() => arkenv(def, config));
}

/**
 * ArkEnv's Standard Schema export
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 */
export default arkenv;
