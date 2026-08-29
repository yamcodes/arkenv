import type { StandardSchemaV1 } from "@repo/types";
import {
	ArkEnvError,
	assertNotArkTypeDsl,
	assertStandardSchema,
	assertStandardSchemaMap,
	type EnvIssue,
	formatIssues,
	getSchemaKeys,
	isCapturingSchema,
	type ParseStandardConfig,
	parseStandard,
	recordSchemaCapture,
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
 * Configuration options for `arkenv` from `@arkenv/standard`.
 */
export type StandardEnvConfig = ParseStandardConfig;

type StandardEnvOutput<T extends Record<string, StandardSchemaV1>> = {
	[K in keyof T]: StandardSchemaV1.InferOutput<T[K]>;
};

/**
 * Parse and validate environment variables using Standard Schema 1.0 validators (e.g. Zod, Valibot).
 *
 * This entry is ArkType-free - ArkType is never imported, even transitively.
 * Use this when your project must not depend on ArkType.
 *
 * @param def An object mapping variable names to Standard Schema validators
 * @param config Optional configuration
 * @returns The validated environment variables, a SafeArkEnvResult if `{ safe: true }` is configured, or a value-less stub when schema capture is active
 * @throws An {@link ArkEnvError} if validation fails and `safe` is not enabled
 *
 * @example
 * ```ts
 * import arkenv from "@arkenv/standard";
 * import * as z from "zod";
 *
 * const env = arkenv({
 *   PORT: z.number(),
 *   HOST: z.string(),
 * });
 * ```
 */
export function arkenv<
	const T extends Record<string, StandardSchemaV1>,
	const Safe extends boolean | undefined = undefined,
>(
	def: T,
	config?: Omit<StandardEnvConfig, "safe"> & { safe?: Safe },
): [Safe] extends [true]
	? SafeArkEnvResult<StandardEnvOutput<T>>
	: StandardEnvOutput<T> {
	const resolved = (config ?? {}) as StandardEnvConfig;
	assertStandardSchemaMap(def);

	for (const key in def) {
		const validator = (def as Record<string, unknown>)[key];
		assertNotArkTypeDsl(key, validator);
		assertStandardSchema(key, validator);
	}

	if (isCapturingSchema()) {
		recordSchemaCapture(def);
		// Capture records the schema only. The returned object has no values, so
		// schema modules must stay declarative and must not require env at module scope.
		return {} as [Safe] extends [true]
			? SafeArkEnvResult<StandardEnvOutput<T>>
			: StandardEnvOutput<T>;
	}

	if (resolved.safe) {
		return safeExecute(
			() =>
				parseStandard(
					def as Record<string, unknown>,
					resolved,
				) as StandardEnvOutput<T>,
		) as [Safe] extends [true]
			? SafeArkEnvResult<StandardEnvOutput<T>>
			: StandardEnvOutput<T>;
	}

	return parseStandard(def as Record<string, unknown>, resolved) as [
		Safe,
	] extends [true]
		? SafeArkEnvResult<StandardEnvOutput<T>>
		: StandardEnvOutput<T>;
}

export default arkenv;
