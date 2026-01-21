import type { type } from "arktype";
import type { StandardSchemaV1 } from "./standard-schema";

/**
 * Extract the inferred type from a schema definition.
 * Supports both ArkType type definitions and Standard Schema 1.0 validators.
 *
 * For Standard Schema validators (e.g., Zod, Valibot), extracts the output type.
 * For ArkType definitions, checks the call signature or type properties.
 *
 * @template T - The schema definition to infer from
 */
export type InferType<T> =
	// First, check if it's a Standard Schema validator
	T extends StandardSchemaV1<infer _Input, infer Output>
		? Output
		: // Then check ArkType patterns
			T extends (value: Record<string, string | undefined>) => infer R
			? R extends type.errors
				? never
				: R
			: T extends { t: infer U }
				? U
				: T extends type.Any<infer U, infer _Scope>
					? U
					: never;
