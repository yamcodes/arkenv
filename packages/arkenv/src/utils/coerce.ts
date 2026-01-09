import { createRequire } from "node:module";
import { maybeBoolean, maybeJson, maybeNumber } from "@repo/keywords";
import { type JsonSchema } from "arktype";

const require = createRequire(import.meta.url);

/**
 * A marker used in the coercion path to indicate that the target
 * is the *elements* of an array, rather than the array property itself.
 */
const ARRAY_ITEM_MARKER = "*";

/**
 * @internal
 * Information about a path in the schema that requires coercion.
 */
type CoercionTarget = {
	path: string[];
	type: "primitive" | "array" | "object";
};

/**
 * Options for coercion behavior.
 */
export type CoerceOptions = {
	/**
	 * format to use for array parsing
	 * @default "comma"
	 */
	arrayFormat?: "comma" | "json";
};

/**
 * Recursively find all paths in a JSON Schema that require coercion.
 * We prioritize "number", "integer", "boolean", "array", and "object" types.
 */
const findCoercionPaths = (
	node: JsonSchema,
	path: string[] = [],
): CoercionTarget[] => {
	const results: CoercionTarget[] = [];

	if (typeof node === "boolean") {
		return results;
	}

	if ("const" in node) {
		if (typeof node.const === "number" || typeof node.const === "boolean") {
			results.push({ path: [...path], type: "primitive" });
		}
	}

	if ("enum" in node && node.enum) {
		if (
			node.enum.some((v) => typeof v === "number" || typeof v === "boolean")
		) {
			results.push({ path: [...path], type: "primitive" });
		}
	}

	if ("type" in node) {
		if (node.type === "number" || node.type === "integer") {
			results.push({ path: [...path], type: "primitive" });
		} else if (node.type === "boolean") {
			results.push({ path: [...path], type: "primitive" });
		} else if (node.type === "object") {
			// Check if this object has properties defined
			// If it does, we want to coerce the whole object from a JSON string
			// But we also want to recursively check nested properties
			const hasProperties =
				"properties" in node &&
				node.properties &&
				Object.keys(node.properties).length > 0;

			if (hasProperties) {
				// Mark this path as needing object coercion (JSON parsing)
				results.push({ path: [...path], type: "object" });
			}

			// Also recursively check nested properties for their own coercions
			if ("properties" in node && node.properties) {
				for (const [key, prop] of Object.entries(node.properties)) {
					results.push(
						...findCoercionPaths(prop as JsonSchema, [...path, key]),
					);
				}
			}
		} else if (node.type === "array") {
			// Mark the array itself as a target for splitting strings
			results.push({ path: [...path], type: "array" });

			if ("items" in node && node.items) {
				if (Array.isArray(node.items)) {
					// Tuple traversal
					node.items.forEach((item, index) => {
						results.push(
							...findCoercionPaths(item as JsonSchema, [...path, `${index}`]),
						);
					});
				} else {
					// List traversal
					results.push(
						...findCoercionPaths(node.items as JsonSchema, [
							...path,
							ARRAY_ITEM_MARKER,
						]),
					);
				}
			}
		}
	}

	if ("anyOf" in node && node.anyOf) {
		for (const branch of node.anyOf) {
			results.push(...findCoercionPaths(branch as JsonSchema, path));
		}
	}

	if ("allOf" in node && node.allOf) {
		for (const branch of node.allOf) {
			results.push(...findCoercionPaths(branch as JsonSchema, path));
		}
	}

	if ("oneOf" in node && node.oneOf) {
		for (const branch of node.oneOf) {
			results.push(...findCoercionPaths(branch as JsonSchema, path));
		}
	}

	// Deduplicate by path and type combination
	const seen = new Set<string>();
	return results.filter((t) => {
		const key = JSON.stringify(t.path) + t.type;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

/**
 * Apply coercion to a data object based on identified paths.
 */
const applyCoercion = (
	data: unknown,
	targets: CoercionTarget[],
	options: CoerceOptions = {},
) => {
	const { arrayFormat = "comma" } = options;

	// Helper to split string to array
	const splitString = (val: string) => {
		if (arrayFormat === "json") {
			try {
				return JSON.parse(val);
			} catch {
				return val;
			}
		}

		if (!val.trim()) return [];
		return val.split(",").map((s) => s.trim());
	};

	if (typeof data !== "object" || data === null) {
		// If root data needs coercion
		if (targets.some((t) => t.path.length === 0)) {
			const rootTarget = targets.find((t) => t.path.length === 0);

			if (rootTarget?.type === "object" && typeof data === "string") {
				return maybeJson(data);
			}

			if (rootTarget?.type === "array" && typeof data === "string") {
				return splitString(data);
			}

			const asNumber = maybeNumber(data);
			if (typeof asNumber === "number") {
				return asNumber;
			}
			return maybeBoolean(data);
		}
		return data;
	}

	// Sort targets by path length to ensure parent objects/arrays are coerced before their children
	const sortedTargets = [...targets].sort(
		(a, b) => a.path.length - b.path.length,
	);

	const walk = (
		current: unknown,
		targetPath: string[],
		type: "primitive" | "array" | "object",
	) => {
		if (!current || typeof current !== "object") return;

		if (targetPath.length === 0) {
			return;
		}

		// If we've reached the last key, apply coercion
		if (targetPath.length === 1) {
			const lastKey = targetPath[0];

			if (lastKey === ARRAY_ITEM_MARKER) {
				if (Array.isArray(current)) {
					for (let i = 0; i < current.length; i++) {
						const original = current[i];
						if (type === "primitive") {
							const asNumber = maybeNumber(original);
							if (typeof asNumber === "number") {
								current[i] = asNumber;
							} else {
								current[i] = maybeBoolean(original);
							}
						} else if (type === "object") {
							current[i] = maybeJson(original);
						}
					}
				}
				return;
			}

			const record = current as Record<string, unknown>;
			// biome-ignore lint/suspicious/noPrototypeBuiltins: ES2020 compatibility
			if (Object.prototype.hasOwnProperty.call(record, lastKey)) {
				const original = record[lastKey];

				if (type === "array" && typeof original === "string") {
					record[lastKey] = splitString(original);
					return;
				}

				if (type === "object" && typeof original === "string") {
					record[lastKey] = maybeJson(original);
					return;
				}

				if (Array.isArray(original)) {
					if (type === "primitive") {
						for (let i = 0; i < original.length; i++) {
							const item = original[i];
							const asNumber = maybeNumber(item);
							if (typeof asNumber === "number") {
								original[i] = asNumber;
							} else {
								original[i] = maybeBoolean(item);
							}
						}
					}
				} else {
					if (type === "primitive") {
						const asNumber = maybeNumber(original);
						// If numeric parsing didn't produce a number, try boolean coercion
						if (typeof asNumber === "number") {
							record[lastKey] = asNumber;
						} else {
							record[lastKey] = maybeBoolean(original);
						}
					}
				}
			}
			return;
		}

		// Recurse down
		const [nextKey, ...rest] = targetPath;

		if (nextKey === ARRAY_ITEM_MARKER) {
			if (Array.isArray(current)) {
				for (const item of current) {
					walk(item, rest, type);
				}
			}
			return;
		}

		const record = current as Record<string, unknown>;
		walk(record[nextKey], rest, type);
	};

	for (const target of sortedTargets) {
		walk(data, target.path, target.type);
	}

	return data;
};

/**
 * Create a coercing wrapper around an ArkType schema using JSON Schema introspection.
 * Pre-process input data to coerce string values to numbers/booleans at identified paths
 * before validation.
 */
export function coerce(schema: any, options?: CoerceOptions): any {
	const { type } = require("arktype");
	// Use a fallback to handle unjsonifiable parts of the schema (like predicates)
	// by preserving the base schema. This ensures that even if part of the schema
	// cannot be fully represented in JSON Schema, we can still perform coercion
	// for the parts that can.
	const json = schema.in.toJsonSchema({
		fallback: (ctx: any) => ctx.base,
	});
	const targets = findCoercionPaths(json);

	if (targets.length === 0) {
		return schema;
	}

	/*
	 * We use `type("unknown")` to start the pipeline, which initializes a default scope.
	 * Integrating the original `schema` with its custom scope `$` into this pipeline
	 * creates a scope mismatch in TypeScript ({} vs $).
	 * We cast to `BaseType<t, $>` to assert the final contract is maintained.
	 */
	return type("unknown")
		.pipe((data: any) => applyCoercion(data, targets, options))
		.pipe(schema);
}
