import type {
	BaseRoot,
	DeepNodeTransformContext,
	Inner,
	NodeKind,
	NormalizedSchema,
} from "@ark/schema";
import { maybeParsedBoolean, maybeParsedNumber } from "@repo/keywords";
import { type BaseType } from "arktype";

/**
 * @internal
 * Minimal interface for ArkType internal node structure used for coercion.
 * These properties are not part of ArkType's public API but are needed for type checking.
 */
type ArkNodeLike = BaseRoot & {
	domain?: string;
	expression?: string;
	basis?: { domain: string };
	branches?: BaseRoot[];
	unit?: unknown;
};

/**
 * Check if a node represents a numeric type (including intersections, unions, etc.)
 */
const isNumeric = (node: BaseRoot): boolean => {
	const n = node as ArkNodeLike;
	return (
		n.domain === "number" ||
		(n.hasKind("intersection") && n.basis?.domain === "number") ||
		(n.hasKind("union") && n.branches?.some(isNumeric)) ||
		(n.kind === "unit" && typeof n.unit === "number")
	);
};

/**
 * Check if a node represents a boolean type (including unions, etc.)
 */
const isBoolean = (node: BaseRoot): boolean => {
	const n = node as ArkNodeLike;
	return (
		n.domain === "boolean" ||
		n.expression === "boolean" ||
		(n.hasKind("union") && n.branches?.some(isBoolean)) ||
		(n.kind === "unit" && typeof n.unit === "boolean")
	);
};

/**
 * Traverse an ArkType schema and wrap numeric or boolean values in coercion morphs.
 */
export function coerce<t, $ = {}>(schema: BaseType<t, $>): BaseType<t, $> {
	const numInternal: BaseRoot = (maybeParsedNumber as BaseType).internal;
	const boolInternal: BaseRoot = (maybeParsedBoolean as BaseType).internal;

	const node = schema.internal;

	const transformed = node.transform(
		(
			kind: NodeKind,
			inner,
			_ctx: DeepNodeTransformContext,
		): NormalizedSchema<NodeKind> | null => {
			if (kind === "required" || kind === "optional") {
				const propInner = inner as Inner<"required" | "optional">;
				const value = propInner.value;
				let morphedValue: BaseRoot = value;

				// Check if both conditions are true before applying morphs
				const isNumericValue = isNumeric(value);
				const isBooleanValue = isBoolean(value);

				if (isNumericValue && isBooleanValue) {
					// For unions containing both numeric and boolean, compose the morphs
					// Apply boolean morph first, then number morph (loose morphs will pass through unparseable values)
					morphedValue = numInternal.pipe(boolInternal.pipe(value));
				} else if (isNumericValue) {
					morphedValue = numInternal.pipe(value);
				} else if (isBooleanValue) {
					morphedValue = boolInternal.pipe(value);
				}

				return {
					...propInner,
					value: morphedValue,
				} as NormalizedSchema<NodeKind>;
			}

			return inner as NormalizedSchema<NodeKind>;
		},
	);

	// Transform returns a BaseRoot (or null, but in practice it returns the node)
	let finalNode = transformed ?? node;

	// Handle root-level primitives (if the schema itself is numeric or boolean)
	const isNumericNode = isNumeric(finalNode);
	const isBooleanNode = isBoolean(finalNode);

	if (isNumericNode && isBooleanNode) {
		// For unions containing both numeric and boolean, compose the morphs
		// Apply boolean morph first, then number morph (loose morphs will pass through unparseable values)
		finalNode = numInternal.pipe(boolInternal.pipe(finalNode));
	} else if (isNumericNode) {
		finalNode = numInternal.pipe(finalNode);
	} else if (isBooleanNode) {
		finalNode = boolInternal.pipe(finalNode);
	}

	// Use the scope's schema method to properly wrap the BaseRoot back into a Type
	return schema.$.schema(finalNode) as BaseType<t, $>;
}
