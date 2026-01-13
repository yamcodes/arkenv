import { maybeBooleanFn, maybeJsonFn, maybeNumberFn } from "@repo/keywords";
import { arktypeLoader } from "@repo/scope";
import type { JsonSchema, Type } from "arktype";

/**
 * Coerce values in a record based on an ArkType schema's JSON representation.
 */
export function coerce(
	schema: Type,
	env: Record<string, string | undefined>,
	config: {
		numbers: boolean;
		booleans: boolean;
		objects: boolean;
	},
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	// Get JSON representation (custom format in ArkType 2.0)
	let json: any;
	try {
		json = (schema as any).json;
	} catch {
		// No-op
	}

	if (!json) {
		for (const [key, value] of Object.entries(env)) {
			if (value === undefined) continue;
			let coerced: unknown = value;
			if (config.numbers) coerced = maybeNumberFn(coerced);
			if (config.booleans) coerced = maybeBooleanFn(coerced);
			if (config.objects) coerced = maybeJsonFn(coerced);
			result[key] = coerced;
		}
		return result;
	}

	// Build a map of paths that need coercion
	const coercionMap = new Map<string, "number" | "boolean" | "object">();
	traverseRepresentation(json, "", coercionMap);

	for (const [key, value] of Object.entries(env)) {
		if (value === undefined) continue;

		const targetType = coercionMap.get(key);

		if (targetType === "number" && config.numbers) {
			result[key] = maybeNumberFn(value);
		} else if (targetType === "boolean" && config.booleans) {
			result[key] = maybeBooleanFn(value);
		} else if (targetType === "object" && config.objects) {
			result[key] = maybeJsonFn(value);
		} else if (key.includes(".") && config.objects) {
			const parts = key.split(".");
			let current = result;
			for (let i = 0; i < parts.length - 1; i++) {
				const part = parts[i];
				if (!(part in current)) current[part] = {};
				current = current[part] as Record<string, unknown>;
			}
			const lastPart = parts[parts.length - 1];
			let coerced: unknown = value;
			if (config.numbers) coerced = maybeNumberFn(coerced);
			if (config.booleans) coerced = maybeBooleanFn(coerced);
			current[lastPart] = coerced;
		} else {
			result[key] = value;
		}
	}

	return result;
}

/**
 * Traverse ArkType 2.0 custom JSON representation or standard JSON Schema.
 */
function traverseRepresentation(
	schema: any,
	path: string,
	map: Map<string, "number" | "boolean" | "object">,
) {
	if (!schema || typeof schema !== "object") return;

	// ArkType 2.0 format: { domain: 'object', required: [{ key, value }], optional: [...] }
	const domain = schema.domain || schema.type;

	if (domain === "object") {
		// Handle required properties
		if (Array.isArray(schema.required)) {
			for (const entry of schema.required) {
				if (entry.key && entry.value) {
					const fullPath = path ? `${path}.${entry.key}` : entry.key;
					traverseRepresentation(entry.value, fullPath, map);
				} else if (typeof entry === "string") {
					// Standard JSON Schema path: required is just a list of keys
					// but properties are in 'properties' field.
				}
			}
		}

		// Handle optional properties
		if (Array.isArray(schema.optional)) {
			for (const entry of schema.optional) {
				if (entry.key && entry.value) {
					const fullPath = path ? `${path}.${entry.key}` : entry.key;
					traverseRepresentation(entry.value, fullPath, map);
				}
			}
		}

		// Handle standard JSON Schema properties
		if (schema.properties) {
			for (const [prop, propSchema] of Object.entries(schema.properties)) {
				const fullPath = path ? `${path}.${prop}` : prop;
				traverseRepresentation(propSchema, fullPath, map);
			}
		}
	}

	// Leaf nodes
	if (domain === "number" || domain === "integer") {
		map.set(path, "number");
	} else if (domain === "boolean") {
		map.set(path, "boolean");
	} else if (
		domain === "object" &&
		!schema.required &&
		!schema.optional &&
		!schema.properties
	) {
		map.set(path, "object");
	}

	// Handle standard JSON Schema union types
	if (Array.isArray(schema.anyOf)) {
		for (const s of schema.anyOf) {
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

	if (!json) {
		let coerced: unknown = value;
		coerced = maybeNumberFn(coerced);
		if (typeof coerced === "number") return coerced;
		coerced = maybeBooleanFn(coerced);
		if (typeof coerced === "boolean") return coerced;
		return maybeJsonFn(value);
	}

	const domain = json.domain || json.type;

	if (domain === "number" || domain === "integer") return maybeNumberFn(value);
	if (domain === "boolean") return maybeBooleanFn(value);
	if (domain === "object") return maybeJsonFn(value);

	return value;
}
