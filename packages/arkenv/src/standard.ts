import type { StandardSchemaV1 } from "@repo/types";
import { ArkEnvError } from "./errors.ts";
import { assertNotArkTypeDsl, assertStandardSchema } from "./guards.ts";
import { parseStandard } from "./parse-standard.ts";

/**
 * Configuration options for the `arkenv/standard` entry's `createEnv`.
 */
export type StandardEnvConfig = {
	/**
	 * The environment variables to parse. Defaults to `process.env`
	 */
	env?: Record<string, string | undefined>;
	/**
	 * Control how ArkEnv handles environment variables that are not defined in your schema.
	 *
	 * Defaults to `'delete'` to ensure your output object only contains
	 * keys you've explicitly declared.
	 *
	 * - `delete` (ArkEnv default): Undeclared keys are allowed on input but stripped from the output.
	 * - `ignore`: Undeclared keys are allowed and preserved in the output.
	 * - `reject`: Undeclared keys will cause validation to fail.
	 *
	 * @default "delete"
	 */
	onUndeclaredKey?: "ignore" | "delete" | "reject";
};

/**
 * Parse and validate environment variables using Standard Schema 1.0 validators (e.g. Zod, Valibot).
 *
 * This entry is ArkType-free — ArkType is never imported, even transitively.
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
	if (!def || typeof def !== "object" || Array.isArray(def)) {
		throw new ArkEnvError([
			{
				path: "",
				message:
					'Invalid schema: expected an object mapping in "standard" mode.',
			},
		]);
	}

	for (const key in def) {
		const validator = (def as Record<string, unknown>)[key];
		assertNotArkTypeDsl(key, validator);
		assertStandardSchema(key, validator);
	}

	return parseStandard(def as Record<string, unknown>, config ?? {}) as {
		[K in keyof T]: StandardSchemaV1.InferOutput<T[K]>;
	};
}
