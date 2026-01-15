import type { type } from "arktype";

/**
 * Extract the inferred type from an ArkType type definition by checking its call signature.
 * When a type definition is called, it returns either the validated value or type.errors.
 *
 * @template T - The ArkType type definition to infer from
 */
export type InferType<T> = T extends { t: infer U }
	? U
	: T extends (value: Record<string, string | undefined>) => infer R
		? R extends type.errors
			? never
			: R
		: T extends type.Any<infer U, infer _Scope>
			? U
			: never;
