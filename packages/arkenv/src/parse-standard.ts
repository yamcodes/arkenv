import type { ArkEnvConfig } from "./create-env";
import { ArkEnvError, type InternalValidationError } from "./errors";

/**
 * Minimal Standard Schema 1.0 interface for internal usage.
 */
type StandardValidator = {
	"~standard": {
		validate: (
			value: unknown,
		) =>
			| { value: unknown; issues?: readonly { message: string }[] }
			| Promise<unknown>;
	};
};

/**
 * Standard Schema 1.0 parser dispatcher.
 * This helper implements parsing for the 'validator: "standard"' mode.
 */
export function parseStandard(
	def: Record<string, unknown>,
	config: ArkEnvConfig,
) {
	const { env = process.env, onUndeclaredKey = "delete" } = config;
	const output: Record<string, unknown> = {};
	const errors: InternalValidationError[] = [];
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

		const result = (validator as StandardValidator)["~standard"].validate(
			value,
		);

		if (result instanceof Promise) {
			throw new Error(
				`Async validation is not supported for key "${key}". ArkEnv is synchronous.`,
			);
		}

		if (result.issues) {
			for (const issue of result.issues) {
				errors.push({
					path: key,
					message: (issue as { message: string }).message,
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
