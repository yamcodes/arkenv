import type { StandardSchemaV1 } from "@repo/types";
import { ArkEnvError, type ValidationIssue } from "./errors";

type ParseStandardConfig = {
	env?: Record<string, string | undefined>;
	onUndeclaredKey?: "ignore" | "delete" | "reject";
};

/**
 * Standard Schema 1.0 parser dispatcher.
 * This helper implements parsing for the 'validator: "standard"' mode.
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
			throw new Error(
				`Invalid schema for key "${key}": expected a Standard Schema 1.0 validator (e.g. Zod, Valibot) in "standard" mode.`,
			);
		}

		const result = (validator as StandardSchemaV1)["~standard"].validate(value);

		if (result instanceof Promise) {
			throw new Error(
				`Async validation is not supported for key "${key}". ArkEnv is synchronous.`,
			);
		}

		if (result.issues) {
			for (const issue of result.issues) {
				errors.push({
					path: key,
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
