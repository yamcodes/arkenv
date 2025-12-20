import { parsedBoolean, parsedNumber } from "@repo/keywords";
import { $ } from "@repo/scope";

/**
 * Traverse an ArkType schema and wrap numeric or boolean values in coercion morphs.
 */
export function coerce(schema: any): any {
	const numInternal = (parsedNumber as any).internal;
	const boolInternal = (parsedBoolean as any).internal;

	// 1. Transform internal properties
	const transformed = schema.transform((kind: any, inner: any) => {
		if (kind === "required" || kind === "optional") {
			const value = inner.value;

			// Check if the property value is numeric
			const isNumeric =
				value.domain === "number" ||
				(value.hasKind("intersection") && value.basis?.domain === "number");

			if (isNumeric) {
				return { ...inner, value: numInternal.pipe(value) };
			}

			// Check if the property value is boolean
			if (value.expression === "boolean") {
				return { ...inner, value: boolInternal };
			}
		}

		return inner;
	});

	// 2. Handle root-level primitives (if the schema itself is numeric or boolean)
	const isNumeric =
		transformed.domain === "number" ||
		(transformed.hasKind("intersection") &&
			transformed.basis?.domain === "number");

	if (isNumeric) {
		return (parsedNumber as any).pipe(transformed);
	}

	if (transformed.expression === "boolean") {
		return (parsedBoolean as any).pipe(transformed);
	}

	return transformed;
}
