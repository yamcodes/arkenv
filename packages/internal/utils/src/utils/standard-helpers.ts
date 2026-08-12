import type { StandardSchemaV1 } from "@repo/types";
import { ArkEnvError } from "@/core";
import { buildEnvIssue } from "./errors";

/**
 * Whether `value` is a plain object (`{}` / Object.create(null) style).
 * Rejects arrays, `Date`, functions, boxed primitives, etc.
 * @internal
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Object.prototype.toString.call(value) === "[object Object]";
}

/**
 * Extract JSON Schema definitions from standard schema validators.
 *
 * @param def The schema dictionary mapping keys to validators
 * @param toJsonSchema Optional fallback converter when built-in Standard JSON Schema probes fail
 * @returns The generated JSON Schema, a flag indicating if any JSON Schema was found,
 *          and a list of keys that do not support JSON Schema
 * @throws {ArkEnvError} When `toJsonSchema` throws or returns a non-plain object for a key
 */
export function extractJsonSchema(
	def: Record<string, unknown>,
	toJsonSchema?: (schema: StandardSchemaV1) => object | undefined,
): {
	jsonSchema: Record<string, any>;
	hasJsonSchema: boolean;
	missingKeys: string[];
} {
	const jsonSchema: Record<string, any> = { type: "object", properties: {} };
	let hasJsonSchema = false;
	const missingKeys: string[] = [];

	for (const key in def) {
		const validator = def[key] as any;
		if (!validator) {
			missingKeys.push(key);
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

		// 5. Optional user-supplied converter (e.g. Valibot via @valibot/to-json-schema)
		if (toJsonSchema) {
			let converted: object | undefined;
			try {
				converted = toJsonSchema(validator as StandardSchemaV1);
			} catch (error) {
				const detail = error instanceof Error ? error.message : String(error);
				throw new ArkEnvError([
					buildEnvIssue(
						key,
						`toJsonSchema failed for '${key}': ${detail}`,
						"INVALID_SCHEMA",
					),
				]);
			}

			// undefined / falsy → skip this key only (siblings still coerce)
			if (!converted) {
				missingKeys.push(key);
				continue;
			}

			if (!isPlainObject(converted)) {
				throw new ArkEnvError([
					buildEnvIssue(
						key,
						`toJsonSchema must return a plain object or undefined for '${key}'.`,
						"INVALID_SCHEMA",
					),
				]);
			}

			jsonSchema.properties[key] = converted;
			hasJsonSchema = true;
			continue;
		}

		missingKeys.push(key);
	}

	return { jsonSchema, hasJsonSchema, missingKeys };
}

/**
 * Get the property key from a path segment.
 *
 * @param s The path segment which can be a key or a segment object
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
 * @param key The base key of the environment variable
 * @param path The relative path segments of the issue
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
 * @param rawVal The raw string value of the environment variable
 * @param path The path segments of the validation issue
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
