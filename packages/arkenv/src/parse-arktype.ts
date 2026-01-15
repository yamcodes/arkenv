import type { SchemaShape } from "@repo/types";
import { coercion } from ".";
import type { ArkEnvConfig, EnvSchema } from "./create-env";
import { ArkEnvError } from "./errors";
import { loadArkTypeOrThrow } from "./utils/arktype";
import { coerce } from "./coercion/coerce";

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

	const { $, type: at } = loadArkTypeOrThrow();

	// If def is a type definition (has assert method), use it directly
	// Otherwise, use raw() to convert the schema definition
	const isCompiledType = typeof def === "function" && "assert" in def;
	let schema = isCompiledType ? (def as any) : $.type.raw(def);

	// Apply the `onUndeclaredKey` option
	schema = schema.onUndeclaredKey(onUndeclaredKey);

	// Apply coercion transformation to allow strings to be parsed as numbers/booleans
	if (shouldCoerce) {
		schema = coerce(schema, { arrayFormat });
	}

	// Validate the environment variables
	const validatedEnv = schema(env);

	if (validatedEnv instanceof at.errors) {
		throw new ArkEnvError(validatedEnv);
	}

	return validatedEnv;
}
