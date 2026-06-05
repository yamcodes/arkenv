import { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { distill } from "arktype";
import { ArkErrors } from "arktype";
import {
	ArkEnvError,
	type EnvIssue,
	type EnvIssueCode,
	type EnvIssueMeta,
} from "../core.ts";
import type { ArkEnvConfig, EnvSchema } from "../create-env.ts";
import { shouldRedact } from "../utils/redact.ts";
import { styleText } from "../utils/style-text.ts";
import { coerce } from "./coercion/coerce.ts";

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
 * Converts ArkType's `ArkErrors` (keyed by path) into a flat `EnvIssue[]`
 * suitable for `ArkEnvError`. Strips leading path references from messages to
 * avoid duplication when `formatIssues` prepends the styled path, and
 * applies cyan styling to inline "(was …)" values.
 *
 * @internal
 */
function arkErrorsToIssues(
	errors: ArkErrors,
	config?: ArkEnvConfig,
): EnvIssue[] {
	return Object.entries(errors.byPath).map(([path, error]) => {
		let message = error.message;

		// Strip leading path reference if ArkType included it in the message
		let trimmed = message.trimStart();
		if (trimmed.length > 0 && ":.-".includes(trimmed[0])) {
			trimmed = trimmed.slice(1).trimStart();
		}
		if (trimmed.toLowerCase().startsWith(path.toLowerCase())) {
			let rest = trimmed.slice(path.length).trimStart();
			if (rest.length > 0 && ":.-".includes(rest[0])) {
				rest = rest.slice(1);
			}
			message = rest.trimStart();
		}

		// Check for redaction
		const debugSecrets =
			config?.debugSecrets ??
			(typeof process !== "undefined" &&
				(process.env.ARKENV_DEBUG_SECRETS === "true" ||
					process.env.ARKENV_DEBUG_SECRETS === "1"));
		const isSensitive = shouldRedact(path);

		// Style (was ...) inline values
		const valueMatch = message.match(/\(was (.*)\)/);
		if (valueMatch?.[1]) {
			const value = valueMatch[1];
			const displayedValue =
				!debugSecrets && isSensitive ? "[REDACTED]" : value;
			if (!displayedValue.includes("\x1b[")) {
				message = message.replace(
					`(was ${value})`,
					`(was ${styleText("cyan", displayedValue)})`,
				);
			}
		}

		// Map code
		let code: EnvIssueCode = "INVALID_TYPE";
		if (error.code === "required") {
			code = "MISSING_VARIABLE";
		} else if (error.code === "pattern") {
			code = "PATTERN_MISMATCH";
		} else if (["min", "minLength"].includes(error.code)) {
			code = "VALUE_TOO_SMALL";
		} else if (["max", "maxLength"].includes(error.code)) {
			code = "VALUE_TOO_LARGE";
		} else if (
			["divisor", "index", "sequence", "intersection", "union"].includes(
				error.code,
			)
		) {
			code = "INVALID_TYPE";
		} else {
			code = "INVALID_FORMAT";
		}

		// Safe meta extraction
		const meta: EnvIssueMeta = {
			engine: "arktype",
			engineCode: error.code,
		};
		const errObj = error as any;
		if (errObj.min !== undefined && typeof errObj.min === "number") {
			meta.min = errObj.min;
		} else if (errObj.rule !== undefined && typeof errObj.rule === "number") {
			meta.min = errObj.rule;
		}
		if (errObj.max !== undefined && typeof errObj.max === "number") {
			meta.max = errObj.max;
		}

		return {
			path,
			message,
			code,
			expected: error.expected,
			received: error.code === "required" ? undefined : error.data,
			meta,
		};
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
		throw new ArkEnvError(arkErrorsToIssues(validatedEnv, config));
	}

	return validatedEnv;
}
