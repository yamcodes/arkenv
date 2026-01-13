import { arktypeLoader } from "@repo/scope";
import type { Dict } from "@repo/types";
import type { Type } from "arktype";
import { maybeBooleanFn, maybeJsonFn, maybeNumberFn } from "@/morphs";

/**
 * Configuration for the coercion engine.
 */
export type CoerceConfig = {
	/**
	 * Whether to coerce environment variables to numbers.
	 *
	 * @default `true`
	 */
	numbers: boolean;
	/**
	 * Whether to coerce environment variables to booleans.
	 *
	 * @default `true`
	 */
	booleans: boolean;
	/**
	 * Whether to coerce environment variables to objects.
	 *
	 * @default `true`
	 */
	objects: boolean;
	/**
	 * The format to use for array coercion (when `coerce` is enabled).
	 *
	 * - `comma` (default): Strings are split by comma and trimmed.
	 * - `json`: Strings are parsed as JSON.
	 *
	 * @default "comma"
	 */
	arrayFormat: "comma" | "json";
};

const DEFAULT_CONFIG: CoerceConfig = {
	numbers: true,
	booleans: true,
	objects: true,
	arrayFormat: "comma",
};

/**
 * Coerce values in a record based on an ArkType schema's JSON representation.
 *
 * MAINTAINER NOTE: This is a mini-coercion engine.
 * 1. Keep it isolated to arkenv's internal needs.
 * 2. Resist feature creep (do not add specialized rules for every possible type).
 * 3. Standard Schema validators (Zod, etc.) OWN their own coercion; arkenv only
 *    applies this engine to ArkType or raw object mappings.
 */
export function coerce(
	schema: Type,
	env?: Dict<string> | string,
	config: CoerceConfig = DEFAULT_CONFIG,
): any {
	// If env is not provided, return a wrapper function (compat with older tests)
	if (arguments.length === 1) {
		return (input: any) => {
			const coerced = coerce(schema, input, config);
			return schema(coerced);
		};
	}

	// Get JSON representation (custom format in ArkType 2.0)
	let json: any;
	try {
		json = (schema as any).json;
	} catch {
		// No-op
	}

	// Handle primitive root schema
	if (typeof env !== "object" || env === null) {
		if (env === undefined) return undefined;
		return coerceSingleValue(json, env, config);
	}

	const coercionMap = new Map<string, string>();
	if (json) {
		traverseRepresentation(json, "", coercionMap);
	}

	const result = coerceInternal(env, "", coercionMap, config);

	return result;
}

function coerceInternal(
	input: any,
	path: string,
	coercionMap: Map<string, string>,
	config: CoerceConfig,
): any {
	if (input === undefined || input === null) return input;

	const getTargetType = (p: string) => {
		if (coercionMap.has(p)) return coercionMap.get(p);
		// More aggressive wildcard: replace all numeric segments with '*'
		// e.g. SERVICES.0.NAME -> SERVICES.*.NAME, or 0 -> *
		const wildcard = p
			.split(".")
			.map((s) => (/^\d+$/.test(s) ? "*" : s))
			.join(".");
		if (wildcard !== p && coercionMap.has(wildcard)) {
			return coercionMap.get(wildcard);
		}
		return undefined;
	};

	if (Array.isArray(input)) {
		return input.map((v, i) => {
			const fullPath = path ? `${path}.${i}` : `${i}`;
			const targetType = getTargetType(fullPath);

			let coerced = v;
			if (typeof v !== "object" || v === null) {
				coerced = applyCoercion(v, targetType, config);
			}

			if (typeof coerced === "object" && coerced !== null) {
				return coerceInternal(coerced, fullPath, coercionMap, config);
			}
			return coerced;
		});
	}

	if (typeof input === "object") {
		const result: any = {};
		for (const [key, value] of Object.entries(input)) {
			const fullPath = path ? `${path}.${key}` : key;
			const targetType = getTargetType(fullPath);

			let coerced = value;
			if (typeof value !== "object" || value === null) {
				coerced = applyCoercion(value, targetType, config);
			}

			if (typeof coerced === "object" && coerced !== null) {
				result[key] = coerceInternal(coerced, fullPath, coercionMap, config);
			} else if (
				typeof key === "string" &&
				key.includes(".") &&
				config.objects
			) {
				const parts = key.split(".");
				let current = result;
				for (let i = 0; i < parts.length - 1; i++) {
					const part = parts[i];
					if (!(part in current)) current[part] = {};
					current = current[part] as Record<string, unknown>;
				}
				const lastPart = parts[parts.length - 1];
				const inferredTargetType = getTargetType(key);
				current[lastPart] = applyCoercion(value, inferredTargetType, config);
			} else {
				result[key] = coerced;
			}
		}
		return result;
	}

	return applyCoercion(input, getTargetType(path), config);
}

function applyCoercion(
	value: any,
	targetType: string | undefined,
	config: CoerceConfig,
): any {
	if (!targetType) return value;

	let coerced = value;
	const types = targetType.split("|");

	// Priority: object (JSON Parsing) > array (Splitting) > number > boolean
	if (types.includes("object") && config.objects) {
		coerced = maybeJsonFn(coerced);
	}

	if (typeof coerced === "string") {
		if (types.includes("array")) {
			if (
				config.arrayFormat === "json" ||
				coerced.startsWith("[") ||
				coerced.startsWith("{")
			) {
				const parsed = maybeJsonFn(coerced);
				if (Array.isArray(parsed)) return parsed;
			}

			if (config.arrayFormat === "comma" || config.arrayFormat === undefined) {
				return coerced === ""
					? []
					: coerced
							.split(",")
							.map((x) => x.trim())
							.filter((x) => x !== "");
			}
		}

		if (types.includes("number") && config.numbers) {
			coerced = maybeNumberFn(coerced);
		}
		if (
			typeof coerced === "string" &&
			types.includes("boolean") &&
			config.booleans
		) {
			coerced = maybeBooleanFn(coerced);
		}
	}

	return coerced;
}

function coerceSimpleValue(value: any, config: CoerceConfig): any {
	let coerced = value;
	if (config.numbers) coerced = maybeNumberFn(coerced);
	if (config.booleans) coerced = maybeBooleanFn(coerced);
	if (config.objects) coerced = maybeJsonFn(coerced);
	return coerced;
}

function coerceSingleValue(json: any, value: any, config: CoerceConfig): any {
	if (!json) return coerceSimpleValue(value, config);

	const coercionMap = new Map<string, string>();
	traverseRepresentation(json, "", coercionMap);
	return applyCoercion(value, coercionMap.get(""), config);
}

/**
 * Traverse ArkType 2.0 custom JSON representation or standard JSON Schema.
 */
function traverseRepresentation(
	schema: any,
	path: string,
	map: Map<string, string>,
) {
	if (schema === undefined || schema === null) return;

	const recordType = (type: string, p = path) => {
		const existing = map.get(p);
		if (!existing) {
			map.set(p, type);
		} else if (!existing.includes(type)) {
			map.set(p, `${existing}|${type}`);
		}
	};

	// Handle string shorthand for domains
	if (typeof schema === "string") {
		if (schema === "number" || schema === "integer") recordType("number");
		else if (schema === "boolean") recordType("boolean");
		else if (schema === "object") recordType("object");
		return;
	}

	// Handle Unions represented as arrays
	if (Array.isArray(schema)) {
		for (const branch of schema) {
			traverseRepresentation(branch, path, map);
		}
		return;
	}

	if (typeof schema !== "object") return;

	// Leaf nodes
	if (
		schema.unit === "NaN" ||
		schema.unit === "Infinity" ||
		schema.unit === "-Infinity" ||
		typeof schema.unit === "number"
	) {
		recordType("number");
	} else if (typeof schema.unit === "boolean") {
		recordType("boolean");
	}

	// Nested domains (e.g. number.epoch)
	let domain = schema.domain || schema.type;
	if (domain && typeof domain === "object") {
		domain = domain.domain || domain.type;
	}

	// Handle Arrays
	if (
		schema.proto === "Array" ||
		domain === "Array" ||
		schema.sequence ||
		schema.items
	) {
		recordType("array");
		recordType("object");
		const elementSchema = schema.sequence || schema.items;
		if (elementSchema) {
			const elementPath = path ? `${path}.*` : "*";
			traverseRepresentation(elementSchema, elementPath, map);
		}
		return;
	}

	// Mark current path as object if it's an object domain
	if (domain === "object") {
		recordType("object");
	}

	if (domain === "object") {
		if (Array.isArray(schema.required)) {
			for (const entry of schema.required) {
				if (entry.key && entry.value) {
					const fullPath = path ? `${path}.${entry.key}` : entry.key;
					traverseRepresentation(entry.value, fullPath, map);
				}
			}
		}
		if (Array.isArray(schema.optional)) {
			for (const entry of schema.optional) {
				if (entry.key && entry.value) {
					const fullPath = path ? `${path}.${entry.key}` : entry.key;
					traverseRepresentation(entry.value, fullPath, map);
				}
			}
		}
		if (schema.properties) {
			for (const [prop, propSchema] of Object.entries(schema.properties)) {
				const fullPath = path ? `${path}.${prop}` : prop;
				traverseRepresentation(propSchema, fullPath, map);
			}
		}
	}

	// Base leaf domains
	if (domain === "number" || domain === "integer") {
		recordType("number");
	} else if (domain === "boolean") {
		recordType("boolean");
	}

	// Handle standard JSON Schema union types (anyOf / etc)
	const unions =
		schema.anyOf || schema.oneOf || schema.allOf || schema.branches;
	if (Array.isArray(unions)) {
		for (const s of unions) {
			traverseRepresentation(s, path, map);
		}
	}
}

/**
 * Coerces a single value based on the inferred type from a schema.
 */
export function coerceValue(def: unknown, value: unknown): unknown {
	if (typeof value !== "string") return value;
	if ((def as any)?.["~standard"]) return value;

	const at = arktypeLoader.load();
	const { type } = at;

	let t: Type;
	try {
		t = typeof def === "string" ? type(def as any) : (def as Type);
	} catch {
		return value;
	}

	let json: any;
	try {
		json = (t as any).json;
	} catch {
		// No-op
	}

	return coerceSingleValue(json, value, DEFAULT_CONFIG);
}
