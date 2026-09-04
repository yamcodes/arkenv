import type { StandardSchemaV1 } from "@repo/types";
import {
	assertNotArkTypeDsl,
	assertStandardSchema,
	assertStandardSchemaMap,
	isCapturingSchema,
	parseStandard,
	recordSchemaCapture,
	type SafeArkEnvResult,
	safeExecute,
} from "@repo/utils";
import type { StandardEnvConfig } from "./index";

export type { SafeArkEnvResult };

type SafeStandardEnvConfig = Omit<StandardEnvConfig, "safe">;

type StandardEnvOutput<T extends Record<string, StandardSchemaV1>> = {
	[K in keyof T]: StandardSchemaV1.InferOutput<T[K]>;
};

/**
 * Parse environment variables with Standard Schema validators and return a
 * result object instead of throwing.
 *
 * While CLI schema capture is active, records `def` and returns a stub
 * `{ success: true, data: {} }` without validating the environment — same
 * handshake as `arkenv()` from `@arkenv/standard`.
 *
 * @param def An object mapping variable names to Standard Schema validators
 * @param config Optional configuration
 * @returns `{ success: true, data }` or `{ success: false, issues }`
 *
 * @example
 * ```ts
 * import arkenv from "@arkenv/standard/safe";
 * import * as z from "zod";
 *
 * const result = arkenv(
 *   { PORT: z.coerce.number() },
 *   { env: { PORT: "invalid" } },
 * );
 *
 * if (!result.success) {
 *   console.error(result.issues);
 * }
 * ```
 */
export function arkenv<const T extends Record<string, StandardSchemaV1>>(
	def: T,
	config?: SafeStandardEnvConfig,
): SafeArkEnvResult<StandardEnvOutput<T>> {
	const resolved = (config ?? {}) as SafeStandardEnvConfig;
	assertStandardSchemaMap(def);

	for (const key in def) {
		const validator = (def as Record<string, unknown>)[key];
		assertNotArkTypeDsl(key, validator);
		assertStandardSchema(key, validator);
	}

	if (isCapturingSchema()) {
		recordSchemaCapture(def);
		// Capture records the schema only. Stub data has no values, so schema
		// modules must stay declarative and must not require env at module scope.
		return { success: true, data: {} as StandardEnvOutput<T> };
	}

	return safeExecute(
		() =>
			parseStandard(
				def as Record<string, unknown>,
				resolved,
			) as StandardEnvOutput<T>,
	);
}

export default arkenv;
