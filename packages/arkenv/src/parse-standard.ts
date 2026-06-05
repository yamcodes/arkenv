import type { StandardSchemaV1 } from "@repo/types";
import { applyCoercion, findCoercionPaths } from "./coercion/shared.ts";
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
	 * Coercion requires validators that implement the StandardJSONSchemaV1 spec.
	 *
	 * @default false
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
};

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
		coerce = false,
		arrayFormat = "comma",
	} = config;
	const output: Record<string, unknown> = {};
	const errors: ValidationIssue[] = [];
	const envKeys = new Set(Object.keys(env));

	let coercedEnv: Record<string, unknown> = { ...env };
	const missingJsonSchemaKeys: string[] = [];

	if (coerce) {
		const jsonSchema: Record<string, any> = { type: "object", properties: {} };
		let hasJsonSchema = false;

		for (const key in def) {
			const std = (def[key] as any)?.["~standard"];
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
			missingJsonSchemaKeys.push(key);
		}

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
				const issuePath =
					issue.path && issue.path.length > 0
						? `${key}.${issue.path
								.map((segment) =>
									segment !== null &&
									typeof segment === "object" &&
									"key" in segment
										? String(segment.key)
										: String(segment),
								)
								.join(".")}`
						: key;

				let message = issue.message;

				if (coerce && missingJsonSchemaKeys.includes(key)) {
					message += ` (Hint: 'coerce: true' enabled, but the validator for '${key}' lacks Standard JSON Schema support.)`;
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
