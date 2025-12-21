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
	// Validate internal API availability
	// biome-ignore lint/suspicious/noExplicitAny: Internal ArkType properties are not typed in public API.
	if (!maybeParsedNumber || !(maybeParsedNumber as any).internal?.pipe) {
		throw new Error(
			`maybeParsedNumber internal API not found. Please ensure arkenv is being used with a compatible version of ArkType (currently requires .internal.pipe). Got: ${typeof maybeParsedNumber}`,
		);
	}
	// biome-ignore lint/suspicious/noExplicitAny: Internal ArkType properties are not typed in public API.
	if (!maybeParsedBoolean || !(maybeParsedBoolean as any).internal?.pipe) {
		throw new Error("maybeParsedBoolean internal API not available");
	}

	// biome-ignore lint/suspicious/noExplicitAny: Internal ArkType properties are not typed in public API.
	const numInternal = (maybeParsedNumber as any).internal;
	// biome-ignore lint/suspicious/noExplicitAny: Internal ArkType properties are not typed in public API.
	const boolInternal = (maybeParsedBoolean as any).internal;

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
	let result: any = transformedNode;

	if (isNumeric(transformedNode)) {
		// biome-ignore lint/suspicious/noExplicitAny: .pipe is part of internal traversal.
		result = (maybeParsedNumber as any).pipe(result);
	}

	if (isBoolean(transformedNode)) {
		// biome-ignore lint/suspicious/noExplicitAny: .pipe is part of internal traversal.
		result = (maybeParsedBoolean as any).pipe(result);
	}

	// Result may be BaseRoot or BaseType depending on whether morphs were applied
	if (
		result &&
		typeof result === "object" &&
		"internal" in result &&
		!("assert" in result)
	) {
		// Still a BaseRoot, wrap it using scope's schema method to keep good types
		return schema.$.schema(result as BaseRoot) as BaseType<t, $>;
	}

	// Already a BaseType (e.g. from .pipe() calls), return directly
	return result as BaseType<t, $>;
}
