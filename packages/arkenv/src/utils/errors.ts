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
 * Mapping of ArkType validation error codes to normalized EnvIssueCode classification codes.
 */
const ARKTYPE_CODE_MAP = {
	required: "MISSING_VARIABLE",
	pattern: "PATTERN_MISMATCH",
	min: "VALUE_TOO_SMALL",
	minLength: "VALUE_TOO_SMALL",
	max: "VALUE_TOO_LARGE",
	maxLength: "VALUE_TOO_LARGE",
	divisor: "INVALID_TYPE",
	index: "INVALID_TYPE",
	sequence: "INVALID_TYPE",
	intersection: "INVALID_TYPE",
	union: "INVALID_TYPE",
} satisfies Record<string, EnvIssueCode>;

/**
 * Map an ArkType validation error code to a normalized EnvIssueCode.
 *
 * @param engineCode The raw code returned by the ArkType engine
 * @returns The normalized EnvIssueCode classification
 */
export function mapArkTypeCode(engineCode: string): EnvIssueCode {
	return (
		(ARKTYPE_CODE_MAP as Record<string, EnvIssueCode>)[engineCode] ??
		"INVALID_FORMAT"
	);
}

/**
 * Extract validation boundary metadata from an ArkType error object.
 *
 * @param error The raw error object from ArkType
 * @returns An object containing normalized min and/or max values if present
 */
export function getArkTypeMeta(error: any): { min?: number; max?: number } {
	const min = error.min ?? error.rule;
	const max = error.max;
	return {
		...(typeof min === "number" ? { min } : {}),
		...(typeof max === "number" ? { max } : {}),
	};
}

const STANDARD_CODE_MAP: Record<string, EnvIssueCode> = {
	too_small: "VALUE_TOO_SMALL",
	too_big: "VALUE_TOO_LARGE",
	invalid_string: "INVALID_FORMAT",
	invalid_date: "INVALID_FORMAT",
	custom: "INVALID_FORMAT",
};

/**
 * Map a Standard Schema validation issue to a normalized EnvIssueCode.
 *
 * @param engineCode The raw issue code from the Standard Schema engine
 * @param message The error message associated with the issue
 * @param receivedVal The raw value received by the validator
 * @returns The normalized EnvIssueCode classification
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
	if (STANDARD_CODE_MAP[engineCode]) {
		return STANDARD_CODE_MAP[engineCode];
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
 */
export function executeSafe<T>(parseFn: () => T): SafeArkEnvResult<T> {
	try {
		return { success: true, data: parseFn() };
	} catch (error) {
		if (error instanceof ArkEnvError) {
			return { success: false, error };
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
 */
export function buildEnvIssue(
	path: string,
	message: string,
	code: EnvIssueCode,
	meta: EnvIssueMeta,
	expected?: string,
	received?: unknown,
): EnvIssue {
	const issue: EnvIssue = { path, message, code, meta };
	if (expected) issue.expected = expected;
	if (received !== undefined) issue.received = received;
	return issue;
}

/**
 * Format a Standard Schema validation issue message, appending a `(was …)` suffix
 * and redacting sensitive values when appropriate.
 *
 * @param baseMessage The raw message from the Standard Schema validator
 * @param code The normalized issue code
 * @param expected The expected type description, if any
 * @param receivedVal The raw value received by the validator
 * @param path The environment variable name/path under validation
 * @param config Optional config containing the debugSecrets override
 * @returns The formatted message string
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

/**
 * Redact the value inside an existing `(was <value>)` substring within a message.
 *
 * ArkType already embeds `(was …)` in its error messages; this helper swaps the
 * raw value for `[REDACTED]` when the path is sensitive and debug mode is off,
 * and styles the result in cyan.
 *
 * @param message The message containing `(was <value>)`
 * @param path The environment variable name/path under validation
 * @param debugSecrets Optional override for debug secrets mode
 * @returns The message with redacted/styled `(was …)` value
 */
export function redactMessageWasValue(
	message: string,
	path: string,
	debugSecrets?: boolean,
): string {
	const valueMatch = message.match(/\(was (.*)\)/);
	if (!valueMatch?.[1]) return message;

	const value = valueMatch[1];
	const debug = isDebugSecrets(debugSecrets);
	const displayedValue = !debug && shouldRedact(path) ? "[REDACTED]" : value;

	if (displayedValue.includes("\x1b[")) return message;

	return message.replace(
		`(was ${value})`,
		`(was ${styleText("cyan", displayedValue)})`,
	);
}
