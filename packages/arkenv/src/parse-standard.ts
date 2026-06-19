import type { Dict, StandardSchemaV1 } from "@repo/types";
import {
	applyCoercion,
	findCoercionPaths,
	stripEmptyStrings,
} from "@/coercion/shared";
import { ArkEnvError, type EnvIssue, type EnvIssueMeta } from "./core";
import { getStandardMeta, mapStandardCode } from "./utils/errors";
import { isDebugSecrets, safeStringify, shouldRedact } from "./utils/redact";
import {
	extractJsonSchema,
	formatIssuePath,
	traverseReceivedValue,
} from "./utils/standard-helpers";
import { styleText } from "./utils/style-text";

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

	const processedEnv = emptyAsUndefined
		? stripEmptyStrings(env as Dict<string>)
		: env;
	const envKeys = new Set(Object.keys(processedEnv));

	let coercedEnv: Record<string, unknown> = { ...processedEnv };
	const missingJsonSchemaKeys: string[] = [];

	if (coerce) {
		const { jsonSchema, hasJsonSchema } = extractJsonSchema(
			def,
			missingJsonSchemaKeys,
		);
		if (hasJsonSchema) {
			coercedEnv = applyCoercion(coercedEnv, findCoercionPaths(jsonSchema), {
				arrayFormat,
			}) as Record<string, unknown>;
		}
	}

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
				{
					path: key,
					message: `Invalid schema: expected a Standard Schema 1.0 validator (e.g. Zod, Valibot) in 'standard' mode.`,
					code: "INVALID_SCHEMA",
					meta: { engine: "unknown" },
				},
			]);
		}

		const result = (validator as StandardSchemaV1)["~standard"].validate(value);

		if (result instanceof Promise) {
			throw new ArkEnvError([
				{
					path: key,
					message: "Async validation is not supported. ArkEnv is synchronous.",
					code: "INVALID_SCHEMA",
					meta: { engine: "unknown" },
				},
			]);
		}

		if (result.issues) {
			const vendor = (validator as any)["~standard"]?.vendor || "unknown";
			const engine = ["zod", "valibot"].includes(vendor) ? vendor : "unknown";

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
					engine,
					...bounds,
				};
				if (issueCode) meta.engineCode = issueCode;
				const iss = issue as any;
				if (iss.validation !== undefined) meta.validation = iss.validation;
				if (traversalError !== undefined) meta.traversalError = traversalError;

				let message = issue.message;
				if (code === "MISSING_VARIABLE") {
					message = expected
						? `must be ${expected} (was missing)`
						: "is required";
				} else if (!message.includes("(was ")) {
					const debug = isDebugSecrets(config?.debugSecrets);
					const displayVal =
						!debug && shouldRedact(issuePath)
							? "[REDACTED]"
							: safeStringify(receivedVal, issuePath, config);
					const suffix = `(was ${styleText("cyan", displayVal)})`;
					message =
						expected && !message.includes("Expected")
							? `must be ${expected} ${suffix}`
							: `${message} ${suffix}`;
				}

				if (coerce && missingJsonSchemaKeys.includes(key)) {
					message += ` (Hint: coercion is enabled by default, but the validator for '${key}' lacks Standard JSON Schema support.)`;
				}

				const issueObj: EnvIssue = {
					path: issuePath,
					message,
					code,
					meta,
				};
				if (expected) issueObj.expected = expected;
				if (receivedVal !== undefined) issueObj.received = receivedVal;

				errors.push(issueObj);
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
					code: "UNDECLARED_KEY",
					meta: { engine: "unknown" },
				});
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
