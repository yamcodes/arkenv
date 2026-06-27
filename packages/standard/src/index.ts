import type { StandardSchemaV1 } from "@repo/types";
import {
	ArkEnvError,
	assertNotArkTypeDsl,
	assertStandardSchema,
	assertStandardSchemaMap,
	type EnvIssue,
	formatIssues,
	getSchemaKeys,
	type ParseStandardConfig,
	parseStandard,
	type SafeArkEnvResult,
	safeExecute,
} from "@repo/utils";

export {
	ArkEnvError,
	type EnvIssue,
	formatIssues,
	getSchemaKeys,
	type SafeArkEnvResult,
};

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
 * @returns The validated environment variables, or a SafeArkEnvResult if `{ safe: true }` is configured
 * @throws An {@link ArkEnvError} if validation fails and `safe` is not enabled
 *
 * @example
 * ```ts
 * import arkenv from "@arkenv/standard";
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
	config?: StandardEnvConfig & { safe?: false },
): { [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> };
export function arkenv<const T extends Record<string, StandardSchemaV1>>(
	def: T,
	config: StandardEnvConfig & { safe: true },
): SafeArkEnvResult<{ [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> }>;
export function arkenv<const T extends Record<string, StandardSchemaV1>>(
	def: T,
	config: StandardEnvConfig = {},
):
	| { [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> }
	| SafeArkEnvResult<{ [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> }> {
	assertStandardSchemaMap(def);

	for (const key in def) {
		const validator = (def as Record<string, unknown>)[key];
		assertNotArkTypeDsl(key, validator);
		assertStandardSchema(key, validator);
	}

	if (config.safe) {
		return safeExecute(
			() =>
				parseStandard(def as Record<string, unknown>, config) as {
					[K in keyof T]: StandardSchemaV1.InferOutput<T[K]>;
				},
		);
	}

	return parseStandard(def as Record<string, unknown>, config) as {
		[K in keyof T]: StandardSchemaV1.InferOutput<T[K]>;
	};
}

export default arkenv;
