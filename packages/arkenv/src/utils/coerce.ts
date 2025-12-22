import { maybeParsedBoolean, maybeParsedNumber } from "@repo/keywords";
import { type BaseType, type JsonSchema, type } from "arktype";

const ARRAY_ITEM_MARKER = "*";

/**
 * @internal
 * Information about a path in the schema that requires coercion.
 */
interface CoercionTarget {
	path: string[];
}

/**
 * Recursively find all paths in a JSON Schema that require coercion.
 * We prioritize "number", "integer", and "boolean" types.
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
			results.push({ path: [...path] });
		}
	}

	if ("enum" in node && node.enum) {
		if (
			node.enum.some((v) => typeof v === "number" || typeof v === "boolean")
		) {
			results.push({ path: [...path] });
		}
	}

	if ("type" in node) {
		if (node.type === "number" || node.type === "integer") {
			results.push({ path: [...path] });
		} else if (node.type === "boolean") {
			results.push({ path: [...path] });
		} else if (node.type === "array") {
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
		} else if (node.type === "object") {
			if ("properties" in node && node.properties) {
				for (const [key, prop] of Object.entries(node.properties)) {
					results.push(
						...findCoercionPaths(prop as JsonSchema, [...path, key]),
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

	return results;
};

/**
 * Apply coercion to a data object based on identified paths.
 */
const applyCoercion = (data: unknown, targets: CoercionTarget[]) => {
	if (typeof data !== "object" || data === null) {
		// If root data needs coercion (e.g. root schema is number/boolean), handle it
		if (targets.some((t) => t.path.length === 0)) {
			const asNumber = maybeParsedNumber(data);
			if (typeof asNumber === "number" && !Number.isNaN(asNumber)) {
				return asNumber;
			}
			return maybeParsedBoolean(data);
		}
		return data;
	}

	// biome-ignore lint/suspicious/noExplicitAny: generic traversal requires any
	const walk = (current: any, targetPath: string[]) => {
		if (!current || typeof current !== "object") return;

		// Handle root-level array traversal where path is empty/exhausted but we have a collection
		if (targetPath.length === 0) {
			if (Array.isArray(current)) {
				for (const item of current) {
					walk(item, []);
				}
			}
			return;
		}

		// If we've reached the last key, apply coercion
		if (targetPath.length === 1) {
			const lastKey = targetPath[0];

			if (lastKey === ARRAY_ITEM_MARKER) {
				if (Array.isArray(current)) {
					for (let i = 0; i < current.length; i++) {
						const original = current[i];
						const asNumber = maybeParsedNumber(original);
						if (typeof asNumber === "number" && !Number.isNaN(asNumber)) {
							current[i] = asNumber;
						} else {
							current[i] = maybeParsedBoolean(original);
						}
					}
				}
				return;
			}

			// biome-ignore lint/suspicious/noPrototypeBuiltins: ES2020 compatibility
			if (Object.prototype.hasOwnProperty.call(current, lastKey)) {
				const original = current[lastKey];

				if (Array.isArray(original)) {
					for (let i = 0; i < original.length; i++) {
						const item = original[i];
						const asNumber = maybeParsedNumber(item);
						if (typeof asNumber === "number" && !Number.isNaN(asNumber)) {
							original[i] = asNumber;
						} else {
							original[i] = maybeParsedBoolean(item);
						}
					}
				} else {
					const asNumber = maybeParsedNumber(original);
					// If numeric parsing didn't change type (still string) or is NaN/invalid, try boolean
					if (typeof asNumber === "number" && !Number.isNaN(asNumber)) {
						current[lastKey] = asNumber;
					} else {
						current[lastKey] = maybeParsedBoolean(original);
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
					walk(item, rest);
				}
			}
			return;
		}

		const nextValue = current[nextKey];
		walk(nextValue, rest);
	};

	for (const target of targets) {
		walk(data, target.path);
	}

	return data;
};

/**
 * Traverses an ArkType schema and wraps numeric or boolean values in coercion morphs.
 */
export function coerce<t, $ = {}>(schema: BaseType<t, $>): BaseType<t, $> {
	const json = schema.toJsonSchema();
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
		.pipe((data) => applyCoercion(data, targets))
		.pipe(schema) as BaseType<t, $>;
}
