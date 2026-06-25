import {
	ArkEnvError,
	type EnvIssue,
	type EnvIssueCode,
	type EnvIssueMeta,
	type SafeArkEnvResult,
} from "@/core";
import { isDebugSecrets, safeStringify, shouldRedact } from "./redact";
import { styleText } from "./style-text";

/**
 * Mapping of Standard Schema validation issue codes to normalized EnvIssueCode classification codes.
 *
 * This serves as an internal translation map specifically for Standard Schema validators
 * (such as Zod or Valibot) to map their engine-specific error keys to our unified union type.
 * It is not a duplicate Source of Truth for the allowed issue codes themselves, which are
 * defined solely by the `EnvIssueCode` type in `core.ts`.
 *
 * @internal
 */
const STANDARD_CODE_MAP = {
	too_small: "VALUE_TOO_SMALL",
	too_big: "VALUE_TOO_LARGE",
	invalid_string: "INVALID_FORMAT",
	invalid_date: "INVALID_FORMAT",
	custom: "INVALID_FORMAT",
} satisfies Record<string, EnvIssueCode>;

/**
 * Map a Standard Schema validation issue to a normalized EnvIssueCode.
 *
 * @param engineCode The raw issue code from the Standard Schema engine
 * @param message The error message associated with the issue
 * @param receivedVal The raw value received by the validator
 * @returns The normalized EnvIssueCode classification
 * @internal
 */
export function mapStandardCode(
	engineCode: string,
	message: string,
	receivedVal: unknown,
): EnvIssueCode {
	const msg = message.toLowerCase();
	if (
		(engineCode === "invalid_type" &&
			(receivedVal === undefined || receivedVal === "undefined")) ||
		msg === "required"
	) {
		return "MISSING_VARIABLE";
	}
	if (engineCode in STANDARD_CODE_MAP) {
		return STANDARD_CODE_MAP[engineCode as keyof typeof STANDARD_CODE_MAP];
	}
	if (/regex|pattern|match/.test(msg)) {
		return "PATTERN_MISMATCH";
	}
	return "INVALID_TYPE";
}

/**
 * Extract validation boundary metadata from a Standard Schema issue.
 *
 * @param issue The raw issue from Standard Schema
 * @returns An object containing normalized min and/or max values if present
 * @internal
 */
export function getStandardMeta(issue: any): { min?: number; max?: number } {
	const min = issue.minimum ?? issue.min;
	const max = issue.maximum ?? issue.max;
	return {
		...(typeof min === "number" ? { min } : {}),
		...(typeof max === "number" ? { max } : {}),
	};
}

/**
 * Execute a parser function and return a SafeArkEnvResult.
 *
 * @param parseFn The function that parses the environment variables and might throw an ArkEnvError
 * @returns A SafeArkEnvResult containing either the parsed data or the caught ArkEnvError
 * @internal
 */
export function safeExecute<T>(parseFn: () => T): SafeArkEnvResult<T> {
	try {
		return { success: true, data: parseFn() };
	} catch (error) {
		if (error instanceof ArkEnvError) {
			return { success: false, issues: error.issues };
		}
		throw error;
	}
}

/**
 * Build a normalized {@link EnvIssue}.
 *
 * @param path The dot-separated property path/name of the environment variable
 * @param message The descriptive, user-friendly error message
 * @param code The normalized classification code for the issue
 * @param meta Additional validation metadata and engine codes
 * @param expected The expected type or value shape description
 * @param received The raw value received (redacted in string formatting if sensitive)
 * @returns A fully populated EnvIssue
 * @internal
 */
export function buildEnvIssue(
	path: string,
	message: string,
	code: EnvIssueCode,
	meta?: EnvIssueMeta,
	expected?: string,
	received?: unknown,
): EnvIssue {
	const issue: EnvIssue = { path, message, code, meta: meta ?? {} };
	if (expected) issue.expected = expected;
	if (received !== undefined) issue.received = received;
	return issue;
}

/**
 * Format a Standard Schema validation issue message, appending a `(was …)` substring
 * and redacting sensitive values when appropriate.
 *
 * @param baseMessage The raw message from the Standard Schema validator
 * @param code The normalized issue code
 * @param expected The expected type description, if any
 * @param receivedVal The raw value received by the validator
 * @param path The environment variable name/path under validation
 * @param config Optional config containing the debugSecrets override
 * @returns The formatted message string
 * @internal
 */
export function formatStandardIssueMessage(
	baseMessage: string,
	code: EnvIssueCode,
	expected: string | undefined,
	receivedVal: unknown,
	path: string,
	config?: { debugSecrets?: boolean },
): string {
	if (code === "MISSING_VARIABLE") {
		return expected ? `must be ${expected} (was missing)` : "is required";
	}

	if (baseMessage.includes("(was ")) return baseMessage;

	const debug = isDebugSecrets(config?.debugSecrets);
	const displayVal =
		!debug && shouldRedact(path)
			? "[REDACTED]"
			: safeStringify(receivedVal, path, config);
	const suffix = `(was ${styleText("cyan", displayVal)})`;

	return expected && !baseMessage.includes("Expected")
		? `must be ${expected} ${suffix}`
		: `${baseMessage} ${suffix}`;
}
