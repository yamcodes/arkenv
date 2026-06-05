import type { StandardSchemaV1 } from "@repo/types";
import {
	ArkEnvError,
	type EnvIssue,
	type EnvIssueCode,
	type EnvIssueMeta,
} from "./core.ts";
import { safeStringify, shouldRedact } from "./utils/redact.ts";
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
				const getProp = (s: any) =>
					s && typeof s === "object" && "key" in s ? String(s.key) : String(s);
				const issuePath =
					issue.path && issue.path.length > 0
						? `${key}.${issue.path.map(getProp).join(".")}`
						: key;

				let receivedVal: unknown;
				let traversalError: string | undefined;

				if (key in env) {
					const rawVal = env[key];
					receivedVal = rawVal;
					if (rawVal !== undefined && issue.path?.length) {
						try {
							let current: any = rawVal;
							const trimmed = rawVal.trim();
							if (trimmed[0] === "{" || trimmed[0] === "[") {
								try {
									current = JSON.parse(rawVal);
								} catch (e: any) {
									traversalError = `[Unparseable JSON: ${e.message}]`;
								}
							}
							if (!traversalError) {
								for (const seg of issue.path) {
									current = current?.[getProp(seg)];
								}
								receivedVal = current;
							}
						} catch (e: any) {
							traversalError = `[Traversal error: ${e.message}]`;
						}
					}
				} else {
					receivedVal = (issue as any).received;
				}

				const issueCode = (issue as any).code;
				let code: EnvIssueCode = "INVALID_TYPE";
				const msg = issue.message?.toLowerCase() || "";

				if (
					(issueCode === "invalid_type" &&
						(receivedVal === undefined || receivedVal === "undefined")) ||
					msg === "required"
				) {
					code = "MISSING_VARIABLE";
				} else if (
					["invalid_string", "invalid_date", "custom"].includes(issueCode)
				) {
					code = "INVALID_FORMAT";
				} else if (issueCode === "too_small") {
					code = "VALUE_TOO_SMALL";
				} else if (issueCode === "too_big") {
					code = "VALUE_TOO_LARGE";
				} else if (/regex|pattern|match/.test(msg)) {
					code = "PATTERN_MISMATCH";
				}

				const expected = (issue as any).expected || undefined;
				const iss = issue as any;
				const meta: EnvIssueMeta = {
					engine,
					engineCode: issueCode || undefined,
					min: iss.minimum ?? iss.min,
					max: iss.maximum ?? iss.max,
					validation: iss.validation,
					traversalError,
				};

				let message = issue.message;
				if (code === "MISSING_VARIABLE") {
					message = expected
						? `must be ${expected} (was missing)`
						: "is required";
				} else if (!message.includes("(was ")) {
					const debugSecrets =
						config?.debugSecrets ??
						(typeof process !== "undefined" &&
							(process.env.ARKENV_DEBUG_SECRETS === "true" ||
								process.env.ARKENV_DEBUG_SECRETS === "1"));
					const displayVal =
						!debugSecrets && shouldRedact(issuePath)
							? "[REDACTED]"
							: safeStringify(receivedVal, issuePath, config);
					const suffix = `(was ${styleText("cyan", displayVal)})`;
					message =
						expected && !message.includes("Expected")
							? `must be ${expected} ${suffix}`
							: `${message} ${suffix}`;
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
