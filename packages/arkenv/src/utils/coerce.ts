import { $, coercedBoolean, coercedNumber } from "@repo/scope";
import { type } from "arktype";

/**
 * Traverses an ArkType schema and wraps numeric or boolean values in coercion morphs.
 */
export function coerce(schema: any): any {
	const numInternal = (coercedNumber as any).internal;
	const boolInternal = (coercedBoolean as any).internal;

	return schema.transform((kind: any, inner: any, ctx: any) => {
		// Target property values (required/optional)
		if (kind === "required" || kind === "optional") {
			const value = inner.value;

			// Check if the value node is numeric (either a pure number domain or an intersection with a number basis)
			const isNumeric =
				value.domain === "number" ||
				(value.hasKind("intersection") && value.basis?.domain === "number");

			if (isNumeric) {
				return { ...inner, value: numInternal.pipe(value) };
			}

			// Check if the value node is boolean (usually a union)
			if (value.expression === "boolean") {
				return { ...inner, value: boolInternal };
			}
		}

		// Handle root-level primitives
		if (
			ctx.path.length === 0 &&
			(kind === "intersection" || kind === "union" || kind === "domain")
		) {
			const node = $.node(kind, inner);
			const isNumeric =
				node.domain === "number" ||
				(node.hasKind("intersection") && node.basis?.domain === "number");

			if (isNumeric) {
				return numInternal.pipe(node);
			}

			if (node.expression === "boolean") {
				return boolInternal;
			}
		}

		return inner;
	});
}
