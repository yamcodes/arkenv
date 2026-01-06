import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { type } from "arktype";

/**
 * Extract the inferred type from an ArkType type definition or a Standard Schema validator.
 *
 * @template T - The schema definition to infer from
 */
export type InferType<T> =
	T extends StandardSchemaV1<infer U>
		? U
		: T extends (value: Record<string, string | undefined>) => infer R
			? R extends type.errors
				? never
				: R
			: T extends type.Any<infer U, infer _Scope>
				? U
				: never;
