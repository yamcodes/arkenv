import type { EnvIssueCode } from "@/core";

const ARK_CODE_MAP: Record<string, EnvIssueCode> = {
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
};

/**
 * Map an ArkType validation error code to a normalized EnvIssueCode.
 *
 * @param engineCode - The raw code returned by the ArkType engine
 * @returns The normalized EnvIssueCode classification
 */
export function mapArkTypeCode(engineCode: string): EnvIssueCode {
	return ARK_CODE_MAP[engineCode] ?? "INVALID_FORMAT";
}

/**
 * Extract validation boundary metadata from an ArkType error object.
 *
 * @param error - The raw error object from ArkType
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
 * @param engineCode - The raw issue code from the Standard Schema engine
 * @param message - The error message associated with the issue
 * @param receivedVal - The raw value received by the validator
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
 * @param issue - The raw issue from Standard Schema
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
