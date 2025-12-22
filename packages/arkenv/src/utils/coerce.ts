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
/**
 * @internal
 * Extension of BaseType to access internal properties needed for coercion.
 */
type BaseTypeWithInternal = BaseType & {
	internal: BaseRoot & {
		pipe: (node: BaseRoot) => BaseRoot;
	};
};

export function coerce<t, $ = {}>(schema: BaseType<t, $>): BaseType<t, $> {
	const numType = maybeParsedNumber as BaseTypeWithInternal;
	const boolType = maybeParsedBoolean as BaseTypeWithInternal;

	// Validate internal API availability
	if (!numType?.internal?.pipe) {
		throw new Error(
			`maybeParsedNumber internal API not found. Please ensure arkenv is being used with a compatible version of ArkType (currently requires .internal.pipe). Got: ${typeof maybeParsedNumber}`,
		);
	}
	if (!boolType?.internal?.pipe) {
		throw new Error(
			`maybeParsedBoolean internal API not found. Please ensure arkenv is being used with a compatible version of ArkType (currently requires .internal.pipe). Got: ${typeof maybeParsedBoolean}`,
		);
	}

	const numInternal = numType.internal;
	const boolInternal = boolType.internal;

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

				// Sequential application is intentional (both numInternal.pipe and boolInternal.pipe are run)
				// to support mixed-type unions. The order of application matters; do not change to else-if
				// without considering union coercion semantics.
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
	let result: BaseRoot | BaseType = transformedNode;

	if (isNumeric(transformedNode)) {
		// Pass internal node to public .pipe() by casting to Type<any> once
		result = (maybeParsedNumber as BaseType<unknown>).pipe(result as never);
	}

	if (isBoolean(transformedNode)) {
		// Pass internal node to public .pipe() by casting to Type<any> once
		result = (maybeParsedBoolean as BaseType<unknown>).pipe(result as never);
	}

	// Result may be BaseRoot (unwrapped internal node) or BaseType (public API wrapper).
	// In ArkType 2.0, unwrapped nodes have an .internal getter returning themselves
	// and a .kind property, while public Type wrappers have an .internal property
	// pointing to the node and lack a .kind property on the wrapper itself.
	if (
		result &&
		typeof result === "object" &&
		"kind" in result &&
		(result as Record<string, unknown>).internal === result &&
		!("assert" in result)
	) {
		// Still a raw BaseRoot, wrap it using scope's schema method to attach Type methods
		return schema.$.schema(result as BaseRoot) as unknown as BaseType<t, $>;
	}

	// Already a BaseType (e.g. from .pipe() calls), return directly
	return result as unknown as BaseType<t, $>;
}
