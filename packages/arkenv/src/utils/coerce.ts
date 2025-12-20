import type {
	BaseRoot,
	DeepNodeTransformContext,
	Inner,
	NodeKind,
	NormalizedSchema,
} from "@ark/schema";
import { parsedBoolean, parsedNumber } from "@repo/keywords";
import { type BaseType, Type, type } from "arktype";

const numberNode: BaseRoot = (type.number as BaseType).internal;
const booleanNode: BaseRoot = (type.boolean as BaseType).internal;

/**
 * Traverse an ArkType schema and wrap numeric or boolean values in coercion morphs.
 */
export function coerce<t>(schema: BaseType<t>): BaseType<t> {
	const numInternal: BaseRoot = (parsedNumber as BaseType).internal;
	const boolInternal: BaseRoot = (parsedBoolean as BaseType).internal;

	const node = schema.internal;

	const transformed = node.transform(
		(
			kind: NodeKind,
			inner: Inner<NodeKind> & { meta: unknown },
			_ctx: DeepNodeTransformContext,
		): NormalizedSchema<NodeKind> | null => {
			if (kind === "required" || kind === "optional") {
				const propInner = inner as Inner<"required" | "optional">;
				const value = propInner.value;

				// We use .extends() to catch refined numbers (e.g. number >= 18)
				// but we skip units to preserve strictness for literals.
				if (value.extends(numberNode) && value.kind !== "unit") {
					// If it's a union, we only coerce if it's not a union of literals
					if (value.hasKind("union")) {
						const isLiteralUnion = value.branches.every((b) =>
							b.hasKind("unit"),
						);
						if (isLiteralUnion) return inner as NormalizedSchema<NodeKind>;
					}

					return {
						...propInner,
						value: numInternal.pipe(value),
					} as NormalizedSchema<NodeKind>;
				}

				if (value.extends(booleanNode) && value.kind !== "unit") {
					return {
						...propInner,
						value: boolInternal.pipe(value),
					} as NormalizedSchema<NodeKind>;
				}
			}

			return inner as NormalizedSchema<NodeKind>;
		},
	);

	// Transform returns a BaseRoot (or null, but in practice it returns the node)
	// We need to wrap it back into a Type (BaseType)
	let finalNode = transformed ?? node;

	// Handle root-level primitives (if the schema itself is numeric or boolean)
	if (finalNode.extends(numberNode) && finalNode.kind !== "unit") {
		if (finalNode.hasKind("union")) {
			const isLiteralUnion = finalNode.branches.every((b) =>
				b.hasKind("unit"),
			);
			if (!isLiteralUnion) {
				finalNode = numInternal.pipe(finalNode);
			}
		} else {
			finalNode = numInternal.pipe(finalNode);
		}
	} else if (finalNode.extends(booleanNode) && finalNode.kind !== "unit") {
		finalNode = boolInternal.pipe(finalNode);
	}

	// Type constructor expects (node, scope)
	return new Type(finalNode, schema.$) as BaseType<t>;
}
