import type { StandardSchemaV1 } from "@repo/types";
import {
	ArkEnvError,
	type EnvIssue,
	type EnvIssueCode,
	type EnvIssueMeta,
	safeStringify,
	shouldRedact,
} from "./core.ts";
import { styleText } from "./utils/style-text.ts";

/**
 * Configuration options for {@link parseStandard}.
 */
export type ParseStandardConfig = {
	/**
	 * The environment variables to parse. Defaults to `process.env`
	 */
	env?: Record<string, string | undefined>;
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
};

/**
 * Standard Schema 1.0 parser dispatcher.
 * This helper implements parsing for the `arkenv/standard` entry point.
 *
 * @param def - An object mapping environment variable keys to Standard Schema 1.0 validators.
 * @param config - Parsing options (env source, undeclared key handling).
 */
export function parseStandard(
	def: Record<string, unknown>,
	config: ParseStandardConfig,
) {
	const { env = process.env, onUndeclaredKey = "delete" } = config;
	const output: Record<string, unknown> = {};
	const errors: EnvIssue[] = [];
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
				const issuePath =
					issue.path && issue.path.length > 0
						? `${key}.${issue.path
								.map((segment) =>
									segment !== null &&
									typeof segment === "object" &&
									"key" in segment
										? String(segment.key)
										: String(segment),
								)
								.join(".")}`
						: key;

				// Resolve received value and handle nested traversal errors
				let receivedVal: unknown;
				let traversalError: string | undefined;

				if (key in env) {
					if (issue.path && issue.path.length > 0) {
						try {
							const rawVal = env[key];
							if (rawVal !== undefined) {
								let current: any = rawVal;
								if (
									typeof rawVal === "string" &&
									(rawVal.trim().startsWith("{") ||
										rawVal.trim().startsWith("["))
								) {
									try {
										current = JSON.parse(rawVal);
									} catch (e: any) {
										traversalError = `[Unparseable JSON: ${e.message}]`;
									}
								}
								if (!traversalError) {
									for (const segment of issue.path) {
										const prop =
											typeof segment === "object" &&
											segment !== null &&
											"key" in segment
												? segment.key
												: segment;
										current = current?.[prop];
									}
									receivedVal = current;
								} else {
									receivedVal = rawVal;
								}
							}
						} catch (e: any) {
							receivedVal = env[key];
							traversalError = `[Traversal error: ${e.message}]`;
						}
					} else {
						receivedVal = env[key];
					}
				} else if ((issue as any).received !== undefined) {
					receivedVal = (issue as any).received;
				}

				// Map engine code to granular EnvIssueCode
				const issueCode = (issue as any).code;
				let code: EnvIssueCode = "INVALID_TYPE";

				if (
					issueCode === "invalid_type" &&
					(receivedVal === undefined || receivedVal === "undefined")
				) {
					code = "MISSING_VARIABLE";
				} else if (
					issueCode === "invalid_string" ||
					issueCode === "invalid_date" ||
					issueCode === "custom"
				) {
					code = "INVALID_FORMAT";
				} else if (issueCode === "too_small") {
					code = "VALUE_TOO_SMALL";
				} else if (issueCode === "too_big") {
					code = "VALUE_TOO_LARGE";
				} else if (
					issue.message &&
					issue.message.toLowerCase() === "required"
				) {
					code = "MISSING_VARIABLE";
				} else if (
					issueCode === "invalid_union" ||
					issueCode === "invalid_arguments" ||
					issueCode === "invalid_return_type"
				) {
					code = "INVALID_TYPE";
				} else if (
					issue.message &&
					/regex|pattern|match/i.test(issue.message)
				) {
					code = "PATTERN_MISMATCH";
				} else {
					code = "INVALID_TYPE";
				}

				const expected = (issue as any).expected || undefined;

				// Safe meta extraction
				const meta: EnvIssueMeta = {
					engine,
					engineCode: issueCode || undefined,
				};
				if ((issue as any).minimum !== undefined) {
					meta.min = (issue as any).minimum;
				} else if ((issue as any).min !== undefined) {
					meta.min = (issue as any).min;
				}
				if ((issue as any).maximum !== undefined) {
					meta.max = (issue as any).maximum;
				} else if ((issue as any).max !== undefined) {
					meta.max = (issue as any).max;
				}
				if ((issue as any).validation !== undefined) {
					meta.validation = (issue as any).validation;
				}
				if (traversalError) {
					meta.traversalError = traversalError;
				}

				// Construct reshaped error message
				let message = issue.message;
				if (code === "MISSING_VARIABLE") {
					message = expected
						? `must be ${expected} (was missing)`
						: "is required";
				} else {
					if (!message.includes("(was ")) {
						const debugSecrets =
							config?.debugSecrets ??
							(typeof process !== "undefined" &&
								(process.env.ARKENV_DEBUG_SECRETS === "true" ||
									process.env.ARKENV_DEBUG_SECRETS === "1"));
						const isSensitive = shouldRedact(issuePath);
						const displayVal =
							!debugSecrets && isSensitive
								? "[REDACTED]"
								: safeStringify(receivedVal, issuePath, config);
						const styledVal = styleText("cyan", displayVal);

						if (expected && !message.includes("Expected")) {
							message = `must be ${expected} (was ${styledVal})`;
						} else {
							message = `${message} (was ${styledVal})`;
						}
					}
				}

				errors.push({
					path: issuePath,
					message,
					code,
					expected,
					received: receivedVal,
					meta,
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
					code: "UNDECLARED_KEY",
					meta: { engine: "unknown" },
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
