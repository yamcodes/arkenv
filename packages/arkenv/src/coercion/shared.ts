import {
	coerceBoolean,
	coerceDate,
	coerceJson,
	coerceNumber,
} from "./morphs.ts";

/**
 * A marker used in the coercion path to indicate that the target
 * is the *elements* of an array, rather than the array property itself.
 */
export const ARRAY_ITEM_MARKER = "*";

/**
 * @internal
 * Information about a path in the schema that requires coercion.
 */
export type CoercionTarget = {
	path: string[];
	type: "primitive" | "array" | "object" | "date";
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
 * Find all paths in a JSON Schema that require coercion.
 *
 * Prioritize "number", "integer", "boolean", "array", "object", and "date" types.
 *
 * @param node The JSON Schema node to traverse
 * @param path The current path segments in the schema tree
 * @returns An array of coercion targets containing their path and type
 */
export const findCoercionPaths = (
	node: Record<string, any>,
	path: string[] = [],
): CoercionTarget[] => {
	const results: CoercionTarget[] = [];
	if (!node || typeof node !== "object") return results;

	if ("const" in node) {
		const t = typeof node.const;
		if (t === "number" || t === "boolean") {
			results.push({ path: [...path], type: "primitive" });
		}
	}

	if ("enum" in node && Array.isArray(node.enum)) {
		if (
			node.enum.some((v) => typeof v === "number" || typeof v === "boolean")
		) {
			results.push({ path: [...path], type: "primitive" });
		}
	}

	const type = node.type;
	if (type === "number" || type === "integer" || type === "boolean") {
		results.push({ path: [...path], type: "primitive" });
	} else if (
		type === "string" &&
		"format" in node &&
		(node.format === "date-time" || node.format === "date")
	) {
		results.push({ path: [...path], type: "date" });
	} else if (type === "object") {
		if (node.properties && Object.keys(node.properties).length > 0) {
			results.push({ path: [...path], type: "object" });
			for (const key in node.properties) {
				results.push(
					...findCoercionPaths(node.properties[key], [...path, key]),
				);
			}
		}
	} else if (type === "array") {
		results.push({ path: [...path], type: "array" });
		if (node.items) {
			if (Array.isArray(node.items)) {
				node.items.forEach((item, index) => {
					results.push(...findCoercionPaths(item, [...path, String(index)]));
				});
			} else {
				results.push(
					...findCoercionPaths(node.items, [...path, ARRAY_ITEM_MARKER]),
				);
			}
		}
	}

	for (const comb of ["anyOf", "allOf", "oneOf"]) {
		if (comb in node && Array.isArray(node[comb])) {
			for (const branch of node[comb]) {
				results.push(...findCoercionPaths(branch, path));
			}
		}
	}

	const seen = new Set<string>();
	return results.filter((t) => {
		const key = t.path.join("/") + ":" + t.type;
		return seen.has(key) ? false : seen.add(key);
	});
};

/**
 * Apply coercion to a data object based on identified paths.
 *
 * @param data The input environment data object to coerce
 * @param targets The coercion targets mapping paths to types
 * @param options The coercion options, including array parsing format
 * @returns The coerced data object
 */
export const applyCoercion = (
	data: unknown,
	targets: CoercionTarget[],
	options: CoerceOptions = {},
) => {
	const { arrayFormat = "comma" } = options;

	const splitString = (val: string) => {
		if (arrayFormat === "json") {
			try {
				return JSON.parse(val);
			} catch {
				return val;
			}
		}
		return val.trim() ? val.split(",").map((s) => s.trim()) : [];
	};

	if (typeof data !== "object" || data === null) {
		const root = targets.find((t) => t.path.length === 0);
		if (root && typeof data === "string") {
			if (root.type === "object") return coerceJson(data);
			if (root.type === "array") return splitString(data);
			if (root.type === "date") return coerceDate(data);
		}
		if (root && root.type === "primitive") {
			const n = coerceNumber(data);
			return typeof n === "number" ? n : coerceBoolean(data);
		}
		return data;
	}

	const sorted = [...targets].sort((a, b) => a.path.length - b.path.length);

	const walk = (current: any, path: string[], type: string) => {
		if (!current || typeof current !== "object" || path.length === 0) return;

		if (path.length === 1) {
			const k = path[0];
			if (k === ARRAY_ITEM_MARKER) {
				if (Array.isArray(current)) {
					for (let i = 0; i < current.length; i++) {
						const v = current[i];
						if (type === "primitive") {
							const n = coerceNumber(v);
							current[i] = typeof n === "number" ? n : coerceBoolean(v);
						} else if (type === "object") {
							current[i] = coerceJson(v);
						} else if (type === "date") {
							current[i] = coerceDate(v);
						}
					}
				}
				return;
			}

			if (Object.hasOwn(current, k)) {
				const v = current[k];
				if (type === "array" && typeof v === "string") {
					current[k] = splitString(v);
				} else if (type === "object" && typeof v === "string") {
					current[k] = coerceJson(v);
				} else if (type === "date" && typeof v === "string") {
					current[k] = coerceDate(v);
				} else if (Array.isArray(v)) {
					if (type === "primitive") {
						for (let i = 0; i < v.length; i++) {
							const n = coerceNumber(v[i]);
							v[i] = typeof n === "number" ? n : coerceBoolean(v[i]);
						}
					}
				} else if (type === "primitive") {
					const n = coerceNumber(v);
					current[k] = typeof n === "number" ? n : coerceBoolean(v);
				}
			}
			return;
		}

		const [next, ...rest] = path;
		if (next === ARRAY_ITEM_MARKER) {
			if (Array.isArray(current)) {
				for (const item of current) walk(item, rest, type);
			}
		} else {
			walk(current[next], rest, type);
		}
	};

	for (const t of sorted) {
		walk(data, t.path, t.type);
	}
	return data;
};
