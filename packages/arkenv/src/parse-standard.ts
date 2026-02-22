import type { StandardSchemaV1 } from "@repo/types";
import { ArkEnvError, type ValidationIssue } from "./errors";

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
};

/**
 * Standard Schema 1.0 parser dispatcher.
 * This helper implements parsing for the 'validator: "standard"' mode.
 *
 * @param def - An object mapping environment variable keys to Standard Schema 1.0 validators.
 * @param config - Parsing options (env source, undeclared key handling).
 */
export function parseStandard(
	def: Record<string, unknown>,
	config: ParseStandardConfig,
) {
	const { env = process.env, onUndeclaredKey = "delete" } = config;
	const output: Record<string, unknown> = {};
	const errors: ValidationIssue[] = [];
	const envKeys = new Set(Object.keys(env));

	// 1. Validate declared keys
	for (const key in def) {
		const validator = def[key];
		const value = env[key];

		// Check if it's a Standard Schema validator
		if (
			!validator ||
			typeof validator !== "object" ||
			!("~standard" in validator)
		) {
			throw new ArkEnvError([
				{
					path: key,
					message: `Invalid schema for key "${key}": expected a Standard Schema 1.0 validator (e.g. Zod, Valibot) in "standard" mode.`,
				},
			]);
		}

		const result = (validator as StandardSchemaV1)["~standard"].validate(value);

		if (result instanceof Promise) {
			throw new ArkEnvError([
				{
					path: key,
					message: `Async validation is not supported for key "${key}". ArkEnv is synchronous.`,
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
				errors.push({
					path: issuePath,
					message: issue.message,
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
				output[key] = env[key];
			}
		}
	}

	if (errors.length > 0) {
		throw new ArkEnvError(errors);
	}

	return output;
}
