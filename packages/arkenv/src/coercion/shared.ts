import { coerceBoolean, coerceDate, coerceJson, coerceNumber } from "./morphs";

/**
 * Remove keys with empty string values from an environment record.
 *
 * When a key is set to `""` (e.g. `PORT=` in a `.env` file), deleting it
 * allows the validator to treat it as missing so that defaults apply.
 *
 * @param env The environment variables record
 * @returns A new record with empty string keys removed
 */
export const stripEmptyStrings = (
	env: Record<string, string | undefined>,
): Record<string, string | undefined> => {
	const result: Record<string, string | undefined> = {};
	for (const key in env) {
		const value = env[key];
		if (value !== "") {
			result[key] = value;
		}
	}
	return result;
};

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

	const coerceValue = (val: unknown, type: CoercionTarget["type"]): unknown => {
		if (type === "array" && typeof val === "string") {
			return splitString(val);
		}
		if (type === "object" && typeof val === "string") {
			return coerceJson(val);
		}
		if (type === "date" && typeof val === "string") {
			return coerceDate(val);
		}
		if (type === "primitive") {
			if (Array.isArray(val)) {
				return val.map((item) => {
					const n = coerceNumber(item);
					return typeof n === "number" ? n : coerceBoolean(item);
				});
			}
			const n = coerceNumber(val);
			return typeof n === "number" ? n : coerceBoolean(val);
		}
		return val;
	};

	if (typeof data !== "object" || data === null) {
		const root = targets.find((t) => t.path.length === 0);
		if (root) {
			return coerceValue(data, root.type);
		}
		return data;
	}

	const sorted = [...targets].sort((a, b) => a.path.length - b.path.length);

	const updateAtPath = (
		current: any,
		path: string[],
		fn: (val: any) => any,
	): any => {
		if (path.length === 0) {
			return fn(current);
		}

		const [key, ...rest] = path;

		if (key === ARRAY_ITEM_MARKER) {
			if (Array.isArray(current)) {
				let changed = false;
				const nextArr = current.map((item) => {
					const nextVal = updateAtPath(item, rest, fn);
					if (nextVal !== item) {
						changed = true;
					}
					return nextVal;
				});
				return changed ? nextArr : current;
			}
			return current;
		}

		if (!current || typeof current !== "object") {
			return current;
		}

		if (Array.isArray(current)) {
			const index = Number(key);
			if (!Number.isNaN(index) && index >= 0 && index < current.length) {
				const nextVal = updateAtPath(current[index], rest, fn);
				if (nextVal !== current[index]) {
					const copy = [...current];
					copy[index] = nextVal;
					return copy;
				}
			}
			return current;
		}

		if (Object.hasOwn(current, key)) {
			const nextVal = updateAtPath(current[key], rest, fn);
			if (nextVal !== current[key]) {
				return {
					...current,
					[key]: nextVal,
				};
			}
		}

		return current;
	};

	let result = data;
	for (const t of sorted) {
		if (t.path.length > 0) {
			result = updateAtPath(result, t.path, (val) => coerceValue(val, t.type));
		}
	}
	return result;
};
