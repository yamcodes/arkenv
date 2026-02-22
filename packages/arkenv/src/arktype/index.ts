import { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { distill } from "arktype";
import { ArkErrors } from "arktype";
import { ArkEnvError, type ValidationIssue } from "../core";
import type { ArkEnvConfig, EnvSchema } from "../create-env";
import { styleText } from "../utils/style-text.ts";
import { coerce } from "./coercion/coerce";

/**
 * Re-export of ArkType's `distill` utilities.
 *
 * Exposed for internal use cases and type-level integrations.
 * ArkEnv does not add behavior or guarantees beyond what ArkType provides.
 *
 * @internal
 * @see https://github.com/arktypeio/arktype
 */
export type { distill };

/**
 * Converts ArkType's `ArkErrors` (keyed by path) into a flat `ValidationIssue[]`
 * suitable for `ArkEnvError`. Strips leading path references from messages to
 * avoid duplication when `formatInternalErrors` prepends the styled path, and
 * applies cyan styling to inline "(was …)" values.
 *
 * @internal
 */
function arkErrorsToIssues(errors: ArkErrors): ValidationIssue[] {
	return Object.entries(errors.byPath).map(([path, error]) => {
		let message = error.message;

		// Strip leading path reference if ArkType included it in the message
		const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const pathRegex = new RegExp(
			`^\\s*[:.-]?\\s*${escapedPath}\\s*[:.-]?\\s*`,
			"i",
		);
		if (pathRegex.test(message)) {
			message = message.replace(pathRegex, "").trimStart();
		}

		// Style (was ...) inline values
		const valueMatch = message.match(/\(was (.*)\)/);
		if (valueMatch?.[1]) {
			const value = valueMatch[1];
			if (!value.includes("\x1b[")) {
				message = message.replace(
					`(was ${value})`,
					`(was ${styleText("cyan", value)})`,
				);
			}
		}

		return { path, message };
	});
}

/**
 * Parse and validate environment variables using ArkEnv's schema rules.
 *
 * This applies:
 * - schema validation
 * - optional coercion (strings → numbers, booleans, arrays)
 * - undeclared key handling
 *
 * On success, returns the validated environment object.
 * On failure, throws an {@link ArkEnvError}.
 *
 * This is a low-level utility used internally by ArkEnv.
 * Most users should prefer the default `arkenv()` export.
 *
 * @internal
 */
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
		throw new ArkEnvError(arkErrorsToIssues(validatedEnv));
	}

	return validatedEnv;
}
