import { ArkErrors } from "arktype";
import type { distill } from "arktype";
import { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { ArkEnvConfig, EnvSchema } from "../create-env.ts";
import { ArkEnvError } from "../errors.ts";
import { coerce } from "./coercion/coerce.ts";

export type { distill };

/**
 * Re-export the ArkType `type` function from the scoped root.
 */
export const type = $.type;

export function parse<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config: ArkEnvConfig,
) {
	const {
		env = process.env,
		coerce: shouldCoerce = true,
		onUndeclaredKey = "delete",
		arrayFormat = "comma",
	} = config;

	// If def is a type definition (has assert method), use it directly
	// Otherwise, use raw() to convert the schema definition
	const isCompiledType = typeof def === "function" && "assert" in def;
	const schema = (isCompiledType ? def : $.type.raw(def)) as any;

	// Apply the `onUndeclaredKey` option
	const schemaWithKeys = schema.onUndeclaredKey(onUndeclaredKey);

	// Apply coercion transformation to allow strings to be parsed as numbers/booleans
	let finalSchema = schemaWithKeys;
	if (shouldCoerce) {
		finalSchema = coerce($.type, schemaWithKeys, { arrayFormat });
	}

	// Validate the environment variables
	const validatedEnv = finalSchema(env);

	// In ArkType 2.x, calling a type as a function returns the validated data or ArkErrors
	if (validatedEnv instanceof ArkErrors) {
		throw new ArkEnvError(validatedEnv);
	}

	return validatedEnv;
}
