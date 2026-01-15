import type { SchemaShape } from "@repo/types";
import { coerce } from "./coercion";
import type { ArkEnvConfig, EnvSchema } from "./create-env";
import { ArkEnvError } from "./errors";
import { loadArkTypeOrThrow } from "./utils/arktype";

/**
 * ArkType-mode parser dispatcher.
 * This helper implements parsing for the default 'validator: "arktype"' mode.
 */
export function parseArkType<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config: ArkEnvConfig,
) {
	const {
		env = process.env,
		coerce: shouldCoerce = true,
		onUndeclaredKey = "delete",
		arrayFormat = "comma",
	} = config;

	const { $ } = loadArkTypeOrThrow();

	// If def is a type definition (has assert method), use it directly
	// Otherwise, use raw() to convert the schema definition
	const isCompiledType = typeof def === "function" && "assert" in def;
	const schema = (isCompiledType ? def : $.type.raw(def)) as any;

	// Apply the `onUndeclaredKey` option
	const schemaWithKeys = schema.onUndeclaredKey(onUndeclaredKey);

	// Apply coercion transformation to allow strings to be parsed as numbers/booleans
	let finalSchema = schemaWithKeys;
	if (shouldCoerce) {
		finalSchema = coerce(schemaWithKeys, { arrayFormat });
	}

	// Validate the environment variables
	const validatedEnv = finalSchema(env);

	const { ArkErrors } = loadArkTypeOrThrow();
	if (validatedEnv instanceof ArkErrors) {
		throw new ArkEnvError(validatedEnv);
	}

	return validatedEnv;
}
