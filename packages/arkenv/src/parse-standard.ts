import type { StandardSchemaV1 } from "@repo/types";
import {
	applyCoercion,
	findCoercionPaths,
	stripEmptyStrings,
} from "./coercion/shared";
import { ArkEnvError, type ValidationIssue } from "./core";

/**
 * Configuration options for {@link parseStandard}.
 */
export type ParseStandardConfig = {
	/**
	 * The environment variables to parse. Defaults to `process.env`
	 */
	env?: Record<string, string | undefined>;
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
 * Format standard schema validation issue path.
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

	const segments = path.map((segment) =>
		segment !== null && typeof segment === "object" && "key" in segment
			? String(segment.key)
			: String(segment),
	);
	return [key, ...segments].join(".");
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
) {
	const {
		env = process.env,
		onUndeclaredKey = "delete",
		coerce = true,
		arrayFormat = "comma",
		emptyAsUndefined = false,
	} = config;
	const output: Record<string, unknown> = {};
	const errors: ValidationIssue[] = [];

	const processedEnv = emptyAsUndefined
		? stripEmptyStrings(env as Record<string, string | undefined>)
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
				},
			]);
		}

		const result = (validator as StandardSchemaV1)["~standard"].validate(value);

		if (result instanceof Promise) {
			throw new ArkEnvError([
				{
					path: key,
					message: "Async validation is not supported. ArkEnv is synchronous.",
				},
			]);
		}

		if (result.issues) {
			for (const issue of result.issues) {
				const issuePath = formatIssuePath(key, issue.path);
				let message = issue.message;

				if (coerce && missingJsonSchemaKeys.includes(key)) {
					message += ` (Hint: coercion is enabled by default, but the validator for '${key}' lacks Standard JSON Schema support.)`;
				}

				errors.push({
					path: issuePath,
					message,
				});
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
