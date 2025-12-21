import { maybeParsedBoolean, maybeParsedNumber } from "@repo/keywords";

const isNumeric = (node: any): boolean =>
	node.domain === "number" ||
	(node.hasKind?.("intersection") && node.basis?.domain === "number") ||
	(node.hasKind?.("union") && node.branches.some(isNumeric)) ||
	(node.kind === "unit" && typeof node.unit === "number");

const isBoolean = (node: any): boolean =>
	node.domain === "boolean" ||
	node.expression === "boolean" ||
	(node.hasKind?.("union") && node.branches.some(isBoolean)) ||
	(node.kind === "unit" && typeof node.unit === "boolean");

/**
 * Traverse an ArkType schema and wrap numeric or boolean values in coercion morphs.
 */
export function coerce(schema: any): any {
	const numInternal = (maybeParsedNumber as any).internal;
	const boolInternal = (maybeParsedBoolean as any).internal;

	// 1. Transform internal properties
	const transformed = schema.transform((kind: any, inner: any) => {
		if (kind === "required" || kind === "optional") {
			const value = inner.value;
			let morphedValue = value;

			if (isNumeric(value)) {
				morphedValue = numInternal.pipe(morphedValue);
			}

			if (isBoolean(value)) {
				morphedValue = boolInternal.pipe(morphedValue);
			}

			return { ...inner, value: morphedValue };
		}

		return inner;
	});

	// 2. Handle root-level primitives (if the schema itself is numeric or boolean)
	let result = transformed;

	if (isNumeric(transformed)) {
		result = (maybeParsedNumber as any).pipe(result);
	}

	if (isBoolean(transformed)) {
		result = (maybeParsedBoolean as any).pipe(result);
	}

	return result;
}
