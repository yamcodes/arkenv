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
}

const isNumeric = (node: ArkNode): boolean =>
	node.domain === "number" ||
	(node.hasKind?.("intersection") && node.basis?.domain === "number") ||
	(node.hasKind?.("union") && node.branches?.some(isNumeric)) ||
	(node.kind === "unit" && typeof node.unit === "number");

const isBoolean = (node: ArkNode): boolean =>
	node.domain === "boolean" ||
	node.expression === "boolean" ||
	(node.hasKind?.("union") && node.branches?.some(isBoolean)) ||
	(node.kind === "unit" && typeof node.unit === "boolean");

/**
 * Traverse an ArkType schema and wrap numeric or boolean values in coercion morphs.
 *
 * @warning This function relies on undocumented ArkType internal APIs (including
 * `.internal`, `.hasKind()`, `.domain`, `.branches`, and `.transform()`).
 * It has been validated against ArkType version `^2.1.22`. Future updates to
 * ArkType may break this implementation if these internal structures change.
 */
// biome-ignore lint/suspicious/noExplicitAny: schema is an ArkType Type, but we use any to avoid importing internal types.
export function coerce(schema: any): any {
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

	// 1. Transform internal properties
	// biome-ignore lint/suspicious/noExplicitAny: inner represents internal node state.
	const transformed = schema.transform((kind: string, inner: any) => {
		if (kind === "required" || kind === "optional") {
			const value = inner.value as ArkNode;
			// biome-ignore lint/suspicious/noExplicitAny: morphedValue can be any transformed node.
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
		// biome-ignore lint/suspicious/noExplicitAny: .pipe is part of internal traversal.
		result = (maybeParsedNumber as any).pipe(result);
	}

	if (isBoolean(transformed as unknown as ArkNode)) {
		// biome-ignore lint/suspicious/noExplicitAny: .pipe is part of internal traversal.
		result = (maybeParsedBoolean as any).pipe(result);
	}

	return result;
}
