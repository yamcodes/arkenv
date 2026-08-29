import type { StandardSchemaV1 } from "@repo/types";
import { ArkEnvError } from "@/core";
import { buildEnvIssue } from "./errors";

/**
 * Standard JSON Schema targets probed in order for on-value converters.
 * @see https://standard-schema.dev
 */
const JSON_SCHEMA_TARGETS = ["draft-07", "draft-2020-12"] as const;

/**
 * Whether `value` is a plain object (`{}` / Object.create(null) style).
 * Rejects arrays, `Date`, functions, boxed primitives, etc.
 * @internal
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Object.prototype.toString.call(value) === "[object Object]";
}

/**
 * Probe an on-value Standard JSON Schema converter across recommended targets.
 *
 * Tries `draft-07`, then `draft-2020-12`. Returns the first plain-object schema.
 * When every attempt throws or returns a non-schema, returns the last failure detail.
 *
 * @param input The converter's `jsonSchema.input` (or equivalent) function
 * @returns A successful schema or the last failure detail
 */
function probeJsonSchemaInput(
	input: (options: { target: (typeof JSON_SCHEMA_TARGETS)[number] }) => unknown,
):
	| { ok: true; schema: Record<string, unknown> }
	| { ok: false; detail: string } {
	let lastDetail = "converter returned a non-schema";

	for (const target of JSON_SCHEMA_TARGETS) {
		try {
			const schema = input({ target });
			if (isPlainObject(schema)) {
				return { ok: true, schema };
			}
			lastDetail = "converter returned a non-schema";
		} catch (error) {
			lastDetail = error instanceof Error ? error.message : String(error);
		}
	}

	return { ok: false, detail: lastDetail };
}

/**
 * Fail the parse when an on-value JSON Schema converter exists but every target fails.
 *
 * @param key The environment variable key whose converter failed
 * @param detail The underlying converter error or non-schema detail
 * @throws {ArkEnvError} Always throws with `INVALID_SCHEMA`
 */
function throwJsonSchemaConversionFailed(key: string, detail: string): never {
	throw new ArkEnvError([
		buildEnvIssue(
			key,
			`JSON Schema conversion failed for '${key}': ${detail}`,
			"INVALID_SCHEMA",
		),
	]);
}

/**
 * Extract JSON Schema definitions from standard schema validators.
 *
 * On-value `jsonSchema.input` probes try `draft-07`, then `draft-2020-12`.
 * When a converter is present but every target fails, the key fails with
 * `INVALID_SCHEMA` instead of being treated as missing JSON Schema.
 *
 * @param def The schema dictionary mapping keys to validators
 * @param toJsonSchema Optional fallback converter when a key has no Standard JSON Schema on the value
 * @returns The generated JSON Schema, a flag indicating if any JSON Schema was found,
 *          and a list of keys that do not support JSON Schema
 * @throws {ArkEnvError} When an on-value converter fails every target, or when
 *   `toJsonSchema` throws or returns a non-plain object for a key
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
			const probed = probeJsonSchemaInput(std.jsonSchema.input);
			if (probed.ok) {
				jsonSchema.properties[key] = probed.schema;
				hasJsonSchema = true;
				continue;
			}
			throwJsonSchemaConversionFailed(key, probed.detail);
		}

		// 2. Direct jsonSchema.input on validator
		if (typeof validator.jsonSchema?.input === "function") {
			const probed = probeJsonSchemaInput(validator.jsonSchema.input);
			if (probed.ok) {
				jsonSchema.properties[key] = probed.schema;
				hasJsonSchema = true;
				continue;
			}
			throwJsonSchemaConversionFailed(key, probed.detail);
		}

		// 3. toJSONSchema method (e.g. classic Zod instance method, zod-to-json-schema)
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
