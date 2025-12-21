import { maybeParsedBoolean, maybeParsedNumber } from "@repo/keywords";

/**
 * @internal
 * Minimal interface for ArkType internal node structure used for coercion.
 * These properties are not part of ArkType's public API.
 */
interface ArkNode {
	kind: string;
	domain?: string;
	hasKind?: (kind: string) => boolean;
	basis?: { domain: string };
	branches?: ArkNode[];
	unit?: unknown;
	expression?: string;
	[key: string]: any;
}

/** Internal capability detection helpers */
const getDomain = (node: ArkNode) => node.domain ?? node.basis?.domain;
const hasKind = (node: ArkNode, kind: string) =>
	node.kind === kind || node.hasKind?.(kind);
const getBranches = (node: ArkNode) => node.branches ?? [];

const isNumeric = (node: ArkNode): boolean =>
	getDomain(node) === "number" ||
	(hasKind(node, "union") && getBranches(node).some(isNumeric)) ||
	(node.kind === "unit" && typeof node.unit === "number");

const isBoolean = (node: ArkNode): boolean =>
	getDomain(node) === "boolean" ||
	node.expression === "boolean" ||
	(hasKind(node, "union") && getBranches(node).some(isBoolean)) ||
	(node.kind === "unit" && typeof node.unit === "boolean");

/**
 * Traverse an ArkType schema and wrap numeric or boolean values in coercion morphs.
 *
 * @warning This function relies on undocumented ArkType internal APIs (including
 * `.internal`, `.hasKind()`, `.domain`, `.branches`, and `.transform()`).
 * It has been validated against ArkType version `^2.1.22`. Future updates to
 * ArkType may break this implementation if these internal structures change.
 */
export function coerce(schema: any): any {
	// ArkType version safeguard
	if (typeof schema.transform !== "function") {
		throw new Error(
			"ArkEnv: The provided ArkType schema does not support .transform(). " +
				"Ensure you are using a compatible version of ArkType (^2.1.22).",
		);
	}

	const numInternal = (maybeParsedNumber as any).internal;
	const boolInternal = (maybeParsedBoolean as any).internal;

	// 1. Transform internal properties
	const transformed = schema.transform((kind: string, inner: any) => {
		if (kind === "required" || kind === "optional") {
			const value = inner.value as ArkNode;
			let morphedValue: any = value;

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

	if (isNumeric(transformed as unknown as ArkNode)) {
		result = (maybeParsedNumber as any).pipe(result);
	}

	if (isBoolean(transformed as unknown as ArkNode)) {
		result = (maybeParsedBoolean as any).pipe(result);
	}

	return result;
}
