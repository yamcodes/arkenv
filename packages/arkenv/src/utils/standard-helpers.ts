import { applyCoercion, findCoercionPaths } from "@/coercion/shared";

/**
 * Extract JSON Schema definitions from standard schema validators.
 *
 * @param def - The schema dictionary mapping keys to validators
 * @param missingJsonSchemaKeys - Array to accumulate keys that do not support JSON Schema
 * @returns The generated JSON Schema and a flag indicating if any JSON Schema was found
 */
export function extractJsonSchema(
	def: Record<string, unknown>,
	missingJsonSchemaKeys: string[],
): { jsonSchema: Record<string, any>; hasJsonSchema: boolean } {
	const jsonSchema: Record<string, any> = { type: "object", properties: {} };
	let hasJsonSchema = false;

	for (const key in def) {
		const validator = def[key] as any;
		if (!validator) {
			missingJsonSchemaKeys.push(key);
			continue;
		}

		// 1. Standard way via ~standard property
		const std = validator["~standard"];
		if (typeof std?.jsonSchema?.input === "function") {
			try {
				const schema = std.jsonSchema.input({ target: "draft-07" });
				if (schema) {
					jsonSchema.properties[key] = schema;
					hasJsonSchema = true;
					continue;
				}
			} catch {}
		}

		// 2. Direct jsonSchema.input on validator
		if (typeof validator.jsonSchema?.input === "function") {
			try {
				const schema = validator.jsonSchema.input({ target: "draft-07" });
				if (schema) {
					jsonSchema.properties[key] = schema;
					hasJsonSchema = true;
					continue;
				}
			} catch {}
		}

		// 3. toJSONSchema method (e.g. zod mini, zod-to-json-schema)
		if (typeof validator.toJSONSchema === "function") {
			try {
				const schema = validator.toJSONSchema();
				if (schema) {
					jsonSchema.properties[key] = schema;
					hasJsonSchema = true;
					continue;
				}
			} catch {}
		}

		// 4. toStandardJSONSchema.v1 method (e.g. stnl)
		if (typeof validator.toStandardJSONSchema?.v1 === "function") {
			try {
				const schema = validator.toStandardJSONSchema.v1();
				if (schema) {
					jsonSchema.properties[key] = schema;
					hasJsonSchema = true;
					continue;
				}
			} catch {}
		}

		missingJsonSchemaKeys.push(key);
	}

	return { jsonSchema, hasJsonSchema };
}

/**
 * Get the property key from a path segment.
 *
 * @param s - The path segment which can be a key or a segment object
 * @returns The string representation of the property key
 */
export function getProp(
	s: string | number | symbol | { readonly key: string | number | symbol },
): string {
	return typeof s === "object" && s !== null && "key" in s
		? String(s.key)
		: String(s);
}

/**
 * Format standard schema validation issue path.
 *
 * @param key - The base key of the environment variable
 * @param path - The relative path segments of the issue
 * @returns The formatted dot-separated path string
 */
export function formatIssuePath(
	key: string,
	path:
		| readonly (
				| string
				| number
				| symbol
				| { readonly key: string | number | symbol }
		  )[]
		| undefined,
): string {
	if (!path || path.length === 0) return key;
	return [key, ...path.map(getProp)].join(".");
}

/**
 * Traverse the raw string value (attempting to parse as JSON if it represents an object/array)
 * to extract the nested value targeted by the issue path.
 *
 * @param rawVal - The raw string value of the environment variable
 * @param path - The path segments of the validation issue
 * @returns An object containing the resolved nested value and an optional traversal error string
 */
export function traverseReceivedValue(
	rawVal: string,
	path: readonly (
		| string
		| number
		| symbol
		| { readonly key: string | number | symbol }
	)[],
): { receivedVal: unknown; traversalError?: string | undefined } {
	let receivedVal: unknown = rawVal;
	let traversalError: string | undefined;

	try {
		let current: any = rawVal;
		const trimmed = rawVal.trim();
		if (trimmed[0] === "{" || trimmed[0] === "[") {
			try {
				current = JSON.parse(rawVal);
			} catch (e: any) {
				traversalError = `[Unparseable JSON: ${e.message}]`;
			}
		}
		if (!traversalError) {
			for (const seg of path) {
				current = current?.[getProp(seg)];
			}
			receivedVal = current;
		}
	} catch (e: any) {
		traversalError = `[Traversal error: ${e.message}]`;
	}

	return { receivedVal, traversalError };
}
