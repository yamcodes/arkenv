import type {
	BaseRoot,
	DeepNodeTransformContext,
	Inner,
	NodeKind,
	NormalizedSchema,
} from "@ark/schema";
import { maybeParsedBoolean, maybeParsedNumber } from "@repo/keywords";
import type { BaseType } from "arktype";

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
 *
 * @warning This function relies on undocumented ArkType internal APIs (including
 * `.internal`, `.hasKind()`, `.domain`, `.branches`, and `.transform()`).
 * It has been validated against ArkType version `^2.1.22`. Future updates to
 * ArkType may break this implementation if these internal structures change.
 */
export function coerce<t, $ = {}>(schema: BaseType<t, $>): BaseType<t, $> {
	const numInternal: BaseRoot = (maybeParsedNumber as BaseType).internal;
	const boolInternal: BaseRoot = (maybeParsedBoolean as BaseType).internal;

	const node = schema.internal;

	// 1. Transform internal properties
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

				if (isNumeric(value)) {
					morphedValue = numInternal.pipe(morphedValue);
				}

				if (isBoolean(value)) {
					morphedValue = boolInternal.pipe(morphedValue);
				}

				return {
					...propInner,
					value: morphedValue,
				} as NormalizedSchema<NodeKind>;
			}

			return inner as NormalizedSchema<NodeKind>;
		},
	);

	// 2. Handle root-level primitives (if the schema itself is numeric or boolean)
	// Match original: check original transformed node, not the morphed result
	const transformedNode = transformed ?? node;
	let result: unknown = transformedNode;

	if (isNumeric(transformedNode)) {
		// Match original: use public .pipe() API (works with BaseRoot internally)
		// @ts-expect-error - Internal API: public .pipe() accepts BaseRoot internally
		result = (maybeParsedNumber as BaseType<unknown>).pipe(result);
	}

	if (isBoolean(transformedNode)) {
		// Match original: use public .pipe() API (works with BaseRoot/BaseType internally)
		// @ts-expect-error - Internal API: public .pipe() accepts BaseRoot/BaseType internally
		result = (maybeParsedBoolean as BaseType<unknown>).pipe(result);
	}

	// Result may be BaseRoot or BaseType depending on whether morphs were applied
	// Match original: return result directly (wrapped if needed for type safety)
	if (
		result &&
		typeof result === "object" &&
		"internal" in result &&
		!("assert" in result)
	) {
		// Still a BaseRoot, wrap it using scope's schema method
		return schema.$.schema(result as BaseRoot) as BaseType<t, $>;
	}

	// Already a BaseType from .pipe() calls, return directly
	return result as BaseType<t, $>;
}
