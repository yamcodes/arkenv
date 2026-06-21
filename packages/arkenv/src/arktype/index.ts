import { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { distill } from "arktype";
import { ArkErrors } from "arktype";
import type { ArkEnvConfig, EnvSchema } from "@/arkenv";
import { coerceEnvironment } from "@/coercion";
import { ArkEnvError, type EnvIssue, type EnvIssueMeta } from "@/core";
import {
	buildEnvIssue,
	getArkTypeMeta,
	mapArkTypeCode,
	redactMessageWasValue,
} from "@/utils/errors";

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
 * Convert ArkType's `ArkErrors` (keyed by path) into a flat `EnvIssue[]`
 * suitable for `ArkEnvError`.
 *
 * @param errors The ArkType errors object to convert
 * @param config Optional ArkEnvConfig to read debugSecrets options
 * @returns An array of flattened validation issues
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

		// Redact and style (was ...) inline values
		message = redactMessageWasValue(message, path, config?.debugSecrets);

		// Map code and metadata using centralized helpers
		const code = mapArkTypeCode(error.code);
		const bounds = getArkTypeMeta(error);
		const meta: EnvIssueMeta = {
			...bounds,
		};

		return buildEnvIssue(
			path,
			message,
			code,
			meta,
			error.expected,
			error.code === "required" ? undefined : error.data,
		);
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
 * @param def The ArkType schema definition to validate against
 * @param config The configuration object for parsing and coercion
 * @returns The parsed and validated environment variables
 * @throws {@link ArkEnvError} if validation fails
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
		emptyAsUndefined = false,
	} = config;

	// If def is a type definition (has assert method), use it directly
	// Otherwise, use raw() to convert the schema definition
	const isCompiledType = typeof def === "function" && "assert" in def;
	const schema = (isCompiledType ? def : $.type.raw(def)) as any;

	// Apply the `onUndeclaredKey` option
	const schemaWithKeys = schema.onUndeclaredKey(onUndeclaredKey);

	// Optionally strip empty strings and apply coercion
	const { coercedEnv } = coerceEnvironment(
		env,
		emptyAsUndefined,
		arrayFormat,
		shouldCoerce
			? () => {
					const json = schemaWithKeys.in.toJsonSchema({
						fallback: (ctx: { base: unknown }) => ctx.base,
					});
					return { schema: json, hasSchema: true };
				}
			: undefined,
	);

	// Validate the environment variables
	const validatedEnv = schemaWithKeys(coercedEnv);

	// In ArkType 2.x, calling a type as a function returns the validated data or ArkErrors
	if (validatedEnv instanceof ArkErrors) {
		throw new ArkEnvError(arkErrorsToIssues(validatedEnv, config));
	}

	return validatedEnv;
}
