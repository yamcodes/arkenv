import { type distill, type } from "arktype";
import { ArkEnvError } from "./errors";
import { $ } from "./scope";

type RuntimeEnvironment = Record<string, string | undefined>;

export type EnvSchema<def> = type.validate<def, (typeof $)["t"]>;

/**
 * Options for configuring environment variable parsing
 */
export interface CreateEnvOptions {
	/**
	 * Environment variables to validate, defaults to `process.env`
	 */
	env?: RuntimeEnvironment;
	/**
	 * Prefix to filter environment variables by.
	 * Only variables starting with this prefix will be included.
	 * The prefix will be removed from the variable name in the result.
	 * @example
	 * // With prefix "BUN_PUBLIC_"
	 * // BUN_PUBLIC_API_URL becomes API_URL in the schema
	 * prefix: "BUN_PUBLIC_"
	 */
	prefix?: string;
}

/**
 * Filter and transform environment variables based on prefix
 */
function filterEnvByPrefix(
	env: RuntimeEnvironment,
	prefix: string,
): RuntimeEnvironment {
	const filtered: RuntimeEnvironment = {};

	for (const [key, value] of Object.entries(env)) {
		if (key.startsWith(prefix)) {
			// Remove the prefix from the key
			const cleanKey = key.slice(prefix.length);
			if (cleanKey) {
				// Don't add empty keys
				filtered[cleanKey] = value;
			}
		}
	}

	return filtered;
}

/**
 * TODO: If possible, find a better type than "const T extends Record<string, unknown>",
 * and be as close as possible to the type accepted by ArkType's `type`.
 */

/**
 * Create an environment variables object from a schema and an environment
 * @param def - The environment variable schema
 * @param options - Configuration options or environment variables (for backward compatibility)
 * @returns The validated environment variable schema
 * @throws An {@link ArkEnvError | error} if the environment variables are invalid.
 */
export function createEnv<const T extends Record<string, unknown>>(
	def: EnvSchema<T>,
	options?: CreateEnvOptions | RuntimeEnvironment,
): distill.Out<type.infer<T, (typeof $)["t"]>> {
	// Handle backward compatibility - if options is not an object with known CreateEnvOptions properties,
	// treat it as the old env parameter
	let env: RuntimeEnvironment;
	let prefix: string | undefined;

	if (
		options &&
		(typeof options.env === "object" || typeof options.prefix === "string")
	) {
		// New options interface
		const opts = options as CreateEnvOptions;
		env = opts.env || process.env;
		prefix = opts.prefix;
	} else {
		// Backward compatibility - treat as env parameter
		env = (options as RuntimeEnvironment) || process.env;
	}

	// Filter by prefix if specified
	if (prefix) {
		env = filterEnvByPrefix(env, prefix);
	}

	const schema = $.type.raw(def);
	const validatedEnv = schema(env);

	if (validatedEnv instanceof type.errors) {
		throw new ArkEnvError(validatedEnv);
	}

	return validatedEnv;
}
