import type { BaseType } from "arktype";
import {
	applyCoercion,
	type CoerceOptions,
	findCoercionPaths,
} from "@/coercion/shared";

/**
 * Create a coercing wrapper around an ArkType schema using JSON Schema introspection.
 * Pre-process input data to coerce string values to numbers/booleans at identified paths
 * before validation.
 */
export function coerce<t, $ = {}>(
	at: any,
	schema: BaseType<t, $>,
	options?: CoerceOptions,
): BaseType<t, $> {
	// Use a fallback to handle unjsonifiable parts of the schema (like predicates)
	// by preserving the base schema. This ensures that even if part of the schema
	// cannot be fully represented in JSON Schema, we can still perform coercion
	// for the parts that can.
	const json = schema.in.toJsonSchema({
		fallback: (ctx) => (ctx as any).base,
	});
	const targets = findCoercionPaths(json as any);

	if (targets.length === 0) {
		return schema;
	}

	/*
	 * We use `type("unknown")` to start the pipeline, which initializes a default scope.
	 * Integrating the original `schema` with its custom scope `$` into this pipeline
	 * creates a scope mismatch in TypeScript ({} vs $).
	 * We cast to `BaseType<t, $>` to assert the final contract is maintained.
	 */
	return at("unknown")
		.pipe((data: unknown) => applyCoercion(data, targets, options))
		.pipe(schema) as BaseType<t, $>;
}
