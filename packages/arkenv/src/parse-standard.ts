import type { Dict, StandardSchemaV1 } from "@repo/types";
import {
	applyCoercion,
	findCoercionPaths,
	stripEmptyStrings,
} from "./coercion/shared.ts";
import {
	ArkEnvError,
	type EnvIssue,
	type EnvIssueCode,
	type EnvIssueMeta,
} from "./core.ts";
import { safeStringify, shouldRedact } from "./utils/redact.ts";
import { styleText } from "./utils/style-text.ts";

/**
 * Configuration options for {@link parseStandard}.
 */
export type ParseStandardConfig = {
	/**
	 * The environment variables to parse. Defaults to `process.env`
	 */
	env?: Dict<string>;
	/**
	 * Control how ArkEnv handles environment variables that are not defined in your schema.
	 *
	 * Defaults to `'delete'` to ensure your output object only contains
	 * keys you've explicitly declared.
	 *
	 * - `delete` (ArkEnv default): Undeclared keys are allowed on input but stripped from the output.
	 * - `ignore`: Undeclared keys are allowed and preserved in the output.
	 * - `reject`: Undeclared keys will cause validation to fail.
	 *
	 * @default "delete"
	 */
	onUndeclaredKey?: "ignore" | "delete" | "reject";
	/**
	 * Whether to bypass secret redaction and print raw sensitive values during debugging.
	 * Defaults to checking `process.env.ARKENV_DEBUG_SECRETS === "true"` or `"1"`.
	 */
	debugSecrets?: boolean;

	/**
	 * Whether to perform best-effort coercion on the environment variables.
	 * Coercion requires validators that implement the StandardJSONSchemaV1 spec
	 * (e.g. Zod, Valibot).
	 *
	 * @see https://standard-schema.dev
	 * @default true
	 */
	coerce?: boolean;

	/**
	 * The format to use for array parsing when coercion is enabled.
	 *
	 * - `comma` (default): Strings are split by comma and trimmed.
	 * - `json`: Strings are parsed as JSON.
	 *
	 * @default "comma"
	 */
	arrayFormat?: "comma" | "json";

	/**
	 * Whether to treat empty strings (`""`) as `undefined` before validation.
	 *
	 * When enabled, an environment variable set to an empty value (e.g. `PORT=`)
	 * will be treated as if it were missing, allowing defaults to apply and
	 * preventing validation errors for numeric or boolean types.
	 *
	 * @default false
	 */
	emptyAsUndefined?: boolean;
};

/**
 * Extract JSON Schema definitions from standard schema validators.
 */
function extractJsonSchema(
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
function getProp(
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
function formatIssuePath(
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
 * Parse and validate environment variables using Standard Schema 1.0 validators.
 *
 * @param def An object mapping environment variable keys to Standard Schema 1.0 validators
 * @param config Parsing options, including environment source, undeclared key handling, and coercion config
 * @returns The parsed and validated environment variables
 * @throws An ArkEnvError if validation fails
 */
export function parseStandard(
	def: Record<string, unknown>,
	config: ParseStandardConfig,
): Record<string, unknown> {
	const {
		env = process.env,
		onUndeclaredKey = "delete",
		coerce = true,
		arrayFormat = "comma",
		emptyAsUndefined = false,
	} = config;
	const output: Record<string, unknown> = {};
	const errors: EnvIssue[] = [];

	const processedEnv = emptyAsUndefined
		? stripEmptyStrings(env as Dict<string>)
		: env;
	const envKeys = new Set(Object.keys(processedEnv));

	let coercedEnv: Record<string, unknown> = { ...processedEnv };
	const missingJsonSchemaKeys: string[] = [];

	if (coerce) {
		const { jsonSchema, hasJsonSchema } = extractJsonSchema(
			def,
			missingJsonSchemaKeys,
		);
		if (hasJsonSchema) {
			coercedEnv = applyCoercion(coercedEnv, findCoercionPaths(jsonSchema), {
				arrayFormat,
			}) as Record<string, unknown>;
		}
	}

	// 1. Validate declared keys
	for (const key in def) {
		const validator = def[key];
		const value = coercedEnv[key];

		// Check if it's a Standard Schema validator
		if (
			!validator ||
			typeof validator !== "object" ||
			!("~standard" in validator)
		) {
			throw new ArkEnvError([
				{
					path: key,
					message: `Invalid schema: expected a Standard Schema 1.0 validator (e.g. Zod, Valibot) in 'standard' mode.`,
					code: "INVALID_SCHEMA",
					meta: { engine: "unknown" },
				},
			]);
		}

		const result = (validator as StandardSchemaV1)["~standard"].validate(value);

		if (result instanceof Promise) {
			throw new ArkEnvError([
				{
					path: key,
					message: "Async validation is not supported. ArkEnv is synchronous.",
					code: "INVALID_SCHEMA",
					meta: { engine: "unknown" },
				},
			]);
		}

		if (result.issues) {
			const vendor = (validator as any)["~standard"]?.vendor || "unknown";
			const engine = ["zod", "valibot"].includes(vendor) ? vendor : "unknown";

			for (const issue of result.issues) {
				const issuePath = formatIssuePath(key, issue.path);

				let receivedVal: unknown;
				let traversalError: string | undefined;

				if (key in processedEnv) {
					const rawVal = processedEnv[key];
					receivedVal = rawVal;
					if (typeof rawVal === "string" && issue.path?.length) {
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
								for (const seg of issue.path) {
									current = current?.[getProp(seg)];
								}
								receivedVal = current;
							}
						} catch (e: any) {
							traversalError = `[Traversal error: ${e.message}]`;
						}
					}
				} else {
					receivedVal = (issue as any).received;
				}

				const issueCode = (issue as any).code;
				let code: EnvIssueCode = "INVALID_TYPE";
				const msg = issue.message?.toLowerCase() || "";

				if (
					(issueCode === "invalid_type" &&
						(receivedVal === undefined || receivedVal === "undefined")) ||
					msg === "required"
				) {
					code = "MISSING_VARIABLE";
				} else if (
					["invalid_string", "invalid_date", "custom"].includes(issueCode)
				) {
					code = "INVALID_FORMAT";
				} else if (issueCode === "too_small") {
					code = "VALUE_TOO_SMALL";
				} else if (issueCode === "too_big") {
					code = "VALUE_TOO_LARGE";
				} else if (/regex|pattern|match/.test(msg)) {
					code = "PATTERN_MISMATCH";
				}

				const expected = (issue as any).expected || undefined;
				const iss = issue as any;
				const meta: EnvIssueMeta = {
					engine,
				};
				if (issueCode) meta.engineCode = issueCode;
				const min = iss.minimum ?? iss.min;
				if (min !== undefined) meta.min = min;
				const max = iss.maximum ?? iss.max;
				if (max !== undefined) meta.max = max;
				if (iss.validation !== undefined) meta.validation = iss.validation;
				if (traversalError !== undefined) meta.traversalError = traversalError;

				let message = issue.message;
				if (code === "MISSING_VARIABLE") {
					message = expected
						? `must be ${expected} (was missing)`
						: "is required";
				} else if (!message.includes("(was ")) {
					const debugSecrets =
						config?.debugSecrets ??
						(typeof process !== "undefined" &&
							(process.env.ARKENV_DEBUG_SECRETS === "true" ||
								process.env.ARKENV_DEBUG_SECRETS === "1"));
					const displayVal =
						!debugSecrets && shouldRedact(issuePath)
							? "[REDACTED]"
							: safeStringify(receivedVal, issuePath, config);
					const suffix = `(was ${styleText("cyan", displayVal)})`;
					message =
						expected && !message.includes("Expected")
							? `must be ${expected} ${suffix}`
							: `${message} ${suffix}`;
				}

				if (coerce && missingJsonSchemaKeys.includes(key)) {
					message += ` (Hint: coercion is enabled by default, but the validator for '${key}' lacks Standard JSON Schema support.)`;
				}

				const issueObj: EnvIssue = {
					path: issuePath,
					message,
					code,
					meta,
				};
				if (expected) issueObj.expected = expected;
				if (receivedVal !== undefined) issueObj.received = receivedVal;

				errors.push(issueObj);
			}
		} else {
			output[key] = result.value;
		}

		envKeys.delete(key);
	}

	// 2. Handle undeclared keys
	if (onUndeclaredKey !== "delete") {
		for (const key of envKeys) {
			if (onUndeclaredKey === "reject") {
				errors.push({
					path: key,
					message: "Undeclared key",
					code: "UNDECLARED_KEY",
					meta: { engine: "unknown" },
				});
			} else if (onUndeclaredKey === "ignore") {
				output[key] = coercedEnv[key];
			}
		}
	}

	if (errors.length > 0) {
		throw new ArkEnvError(errors);
	}

	return output;
}
