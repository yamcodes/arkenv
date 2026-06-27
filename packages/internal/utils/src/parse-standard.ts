import type { Dict, StandardSchemaV1 } from "@repo/types";
import { coerceEnvironment } from "./coercion";
import { ArkEnvError, type EnvIssue, type EnvIssueMeta } from "./core";
import {
	buildEnvIssue,
	formatStandardIssueMessage,
	getStandardMeta,
	mapStandardCode,
} from "./utils/errors";
import {
	extractJsonSchema,
	formatIssuePath,
	traverseReceivedValue,
} from "./utils/standard-helpers";

/*
 * ⚠️ ARCHITECTURAL WARNING: DO NOT DRY THIS FILE ⚠️
 *
 * This file contains parsing logic that looks very similar to the code in
 * `src/arktype/index.ts`. **This duplication is 100% intentional.**
 *
 * `parse-standard.ts` powers the `arkenv/standard` module export. The entire
 * purpose of the `arkenv/standard` entrypoint is to guarantee a zero-dependency
 * environment for users utilizing Zod or Valibot, ensuring the `arktype` library
 * is NEVER included in their bundle.
 *
 * If you attempt to DRY up this code by merging it with the ArkType parser or
 * importing utilities from `src/arktype/*`, bundlers will statically trace those
 * imports and silently drag the entire ArkType library into the `arkenv/standard`
 * bundle.
 *
 * Prioritize strict module boundaries and tree-shaking over DRYness.
 */

/**
 * Configuration options for {@link parseStandard}.
 */
export type ParseStandardConfig = {
	/**
	 * The environment variables to parse. Defaults to `process.env`
	 */
	env?: Dict<string>;
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
	/**
	 * Whether to bypass secret redaction and print raw sensitive values during debugging.
	 * Defaults to checking `process.env.ARKENV_DEBUG_SECRETS === "true"` or `"1"`.
	 */
	debugSecrets?: boolean;

	/**
	 * Whether to perform best-effort coercion on the environment variables.
	 * Coercion requires validators that implement the StandardJSONSchemaV1 spec
	 * (e.g. Zod, Valibot).
	 *
	 * @see https://standard-schema.dev
	 * @default true
	 */
	coerce?: boolean;

	/**
	 * The format to use for array parsing when coercion is enabled.
	 *
	 * - `comma` (default): Strings are split by comma and trimmed.
	 * - `json`: Strings are parsed as JSON.
	 *
	 * @default "comma"
	 */
	arrayFormat?: "comma" | "json";

	/**
	 * Whether to treat empty strings (`""`) as `undefined` before validation.
	 *
	 * When enabled, an environment variable set to an empty value (e.g. `PORT=`)
	 * will be treated as if it were missing, allowing defaults to apply and
	 * preventing validation errors for numeric or boolean types.
	 *
	 * @default false
	 */
	emptyAsUndefined?: boolean;

	/**
	 * Whether to return a safe result object instead of throwing an error on validation failure.
	 *
	 * When enabled, the function returns an object with `{ success: true, data }` or `{ success: false, issues }`.
	 *
	 * @default false
	 */
	safe?: boolean;
};

/**
 * Parse and validate environment variables using Standard Schema 1.0 validators.
 *
 * @param def An object mapping environment variable keys to Standard Schema 1.0 validators
 * @param config Parsing options, including environment source, undeclared key handling, and coercion config
 * @returns The parsed and validated environment variables
 * @throws An ArkEnvError if validation fails
 */
export function parseStandard(
	def: Record<string, unknown>,
	config: ParseStandardConfig,
): Record<string, unknown> {
	const {
		env = process.env,
		onUndeclaredKey = "delete",
		coerce = true,
		arrayFormat = "comma",
		emptyAsUndefined = false,
	} = config;
	const output: Record<string, unknown> = {};
	const errors: EnvIssue[] = [];

	const {
		processedEnv,
		coercedEnv,
		missingKeys: missingJsonSchemaKeys,
	} = coerceEnvironment(
		env as Dict<string>,
		emptyAsUndefined,
		arrayFormat,
		coerce
			? () => {
					const { jsonSchema, hasJsonSchema, missingKeys } =
						extractJsonSchema(def);
					return {
						schema: jsonSchema,
						hasSchema: hasJsonSchema,
						missingKeys,
					};
				}
			: undefined,
	);
	const envKeys = new Set(Object.keys(processedEnv));

	// 1. Validate declared keys
	for (const key in def) {
		const validator = def[key];
		const value = coercedEnv[key];

		// Check if it's a Standard Schema validator
		if (
			!validator ||
			typeof validator !== "object" ||
			!("~standard" in validator)
		) {
			throw new ArkEnvError([
				buildEnvIssue(
					key,
					`Invalid schema: expected a Standard Schema 1.0 validator (e.g. Zod, Valibot) in 'standard' mode.`,
					"INVALID_SCHEMA",
				),
			]);
		}

		const result = (validator as StandardSchemaV1)["~standard"].validate(value);

		if (result instanceof Promise) {
			throw new ArkEnvError([
				buildEnvIssue(
					key,
					"Async validation is not supported. ArkEnv is synchronous.",
					"INVALID_SCHEMA",
				),
			]);
		}

		if (result.issues) {
			for (const issue of result.issues) {
				const issuePath = formatIssuePath(key, issue.path);

				let receivedVal: unknown;
				let traversalError: string | undefined;

				if (key in processedEnv) {
					const rawVal = processedEnv[key];
					if (typeof rawVal === "string" && issue.path?.length) {
						const traversed = traverseReceivedValue(rawVal, issue.path);
						receivedVal = traversed.receivedVal;
						traversalError = traversed.traversalError;
					} else {
						receivedVal = rawVal;
					}
				} else {
					receivedVal = (issue as any).received;
				}

				const issueCode = (issue as any).code || "invalid_type";
				const msg = issue.message || "";
				const code = mapStandardCode(issueCode, msg, receivedVal);

				const expected = (issue as any).expected || undefined;
				const bounds = getStandardMeta(issue);

				const meta: EnvIssueMeta = {
					...bounds,
				};
				const iss = issue as any;
				if (iss.validation !== undefined) meta.validation = iss.validation;
				if (traversalError !== undefined) meta.traversalError = traversalError;

				let message = formatStandardIssueMessage(
					issue.message || "",
					code,
					expected,
					receivedVal,
					issuePath,
					config,
				);

				if (coerce && missingJsonSchemaKeys.includes(key)) {
					message += ` (Hint: coercion is enabled by default, but the validator for '${key}' lacks Standard JSON Schema support.)`;
				}

				errors.push(
					buildEnvIssue(issuePath, message, code, meta, expected, receivedVal),
				);
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
				errors.push(buildEnvIssue(key, "Undeclared key", "UNDECLARED_KEY"));
			} else if (onUndeclaredKey === "ignore") {
				output[key] = coercedEnv[key];
			}
		}
	}

	if (errors.length > 0) {
		throw new ArkEnvError(errors);
	}

	return output;
}
