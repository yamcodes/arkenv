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
	env: Record<string, unknown>,
): Record<string, unknown> => {
	const result: Record<string, unknown> = {};
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
 * Internal representation of a JSON Schema node for coercion traversal.
 */
type JsonSchemaNode = {
	type?: string | string[];
	const?: unknown;
	enum?: unknown[];
	format?: string;
	properties?: Record<string, unknown>;
	items?: unknown | unknown[];
	anyOf?: unknown[];
	allOf?: unknown[];
	oneOf?: unknown[];
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
	node: unknown,
	path: string[] = [],
): CoercionTarget[] => {
	const results: CoercionTarget[] = [];
	if (!node || typeof node !== "object" || Array.isArray(node)) return results;

	const n = node as JsonSchemaNode;

	if ("const" in n) {
		const t = typeof n.const;
		if (t === "number" || t === "boolean") {
			results.push({ path: [...path], type: "primitive" });
		}
	}

	if ("enum" in n && Array.isArray(n.enum)) {
		if (n.enum.some((v) => typeof v === "number" || typeof v === "boolean")) {
			results.push({ path: [...path], type: "primitive" });
		}
	}

	const type = n.type;
	if (type === "number" || type === "integer" || type === "boolean") {
		results.push({ path: [...path], type: "primitive" });
	} else if (
		type === "string" &&
		"format" in n &&
		(n.format === "date-time" || n.format === "date")
	) {
		results.push({ path: [...path], type: "date" });
	} else if (type === "object") {
		if (n.properties && Object.keys(n.properties).length > 0) {
			results.push({ path: [...path], type: "object" });
			for (const key in n.properties) {
				results.push(...findCoercionPaths(n.properties[key], [...path, key]));
			}
		}
	} else if (type === "array") {
		results.push({ path: [...path], type: "array" });
		if (n.items) {
			if (Array.isArray(n.items)) {
				n.items.forEach((item, index) => {
					results.push(...findCoercionPaths(item, [...path, String(index)]));
				});
			} else {
				results.push(
					...findCoercionPaths(n.items, [...path, ARRAY_ITEM_MARKER]),
				);
			}
		}
	}

	for (const comb of ["anyOf", "allOf", "oneOf"] as const) {
		if (n[comb] && Array.isArray(n[comb])) {
			for (const branch of n[comb]) {
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
export const applyCoercion = <T = unknown>(
	data: T,
	targets: CoercionTarget[],
	options: CoerceOptions = {},
): T => {
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
					if (typeof item !== "string") return item;
					const n = coerceNumber(item);
					return typeof n === "number" ? n : coerceBoolean(item);
				});
			}
			if (typeof val !== "string") return val;
			const n = coerceNumber(val);
			return typeof n === "number" ? n : coerceBoolean(val);
		}
		return val;
	};

	if (typeof data !== "object" || data === null) {
		const root = targets.find((t) => t.path.length === 0);
		if (root) {
			return coerceValue(data, root.type) as T;
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
