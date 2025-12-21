import { maybeParsedBoolean, maybeParsedNumber } from "@repo/keywords";
import { type } from "arktype";

/**
 * @internal
 * Minimal interface for ArkType internal node structure used for coercion.
 * These properties are not part of ArkType's public API.
 */
export interface ArkNode {
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

let compatibilityChecked = false;

/**
 * Verifies that the currently loaded version of ArkType matches our internal assumptions.
 * This prevents silent failures if ArkType changes its internal node structure.
 */
function ensureCompatibility(schema: any) {
	if (compatibilityChecked) return;

	try {
		const test = (maybeParsedNumber as any).internal;
		if (!test || typeof test.kind !== "string") {
			throw new Error("Missing .internal or .kind on ArkType nodes.");
		}

		// Check union structure
		// Note: We use type("string | number") which are simple keywords.
		// Using .or() with our keywords (which contain morphs) would cause
		// an "indeterminate union" error during this test.
		const union = (type("string | number") as any).internal;
		if (union.kind === "union" && !Array.isArray(union.branches)) {
			throw new Error("Union nodes no longer expose .branches as an array.");
		}

		if (typeof schema.transform !== "function") {
			throw new Error("Type instances no longer expose .transform().");
		}
	} catch (e: any) {
		throw new Error(
			`ArkEnv Compatibility Error: ${e.message}\n` +
				"The version of ArkType installed is incompatible with ArkEnv's magic coercion. " +
				"Please check https://arkenv.js.org/compatibility for supported ranges.",
		);
	}

	compatibilityChecked = true;
}

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
	ensureCompatibility(schema);

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
