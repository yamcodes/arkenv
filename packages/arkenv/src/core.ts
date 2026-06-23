import { indent } from "@/utils/indent";
import { styleText } from "@/utils/style-text";

/**
 * Machine-readable classification codes for environment validation issues.
 * Serves as the Source of Truth (SoT) for error categorization in ArkEnv.
 */
export type EnvIssueCode =
	/** The environment variable is required but was not provided, and has no default value. */
	| "MISSING_VARIABLE"
	/** The variable value failed a type assertion (e.g., expected a number or boolean but received a string). */
	| "INVALID_TYPE"
	/** The variable value falls below the minimum allowed numeric limit or string/array length constraint. */
	| "VALUE_TOO_SMALL"
	/** The variable value exceeds the maximum allowed numeric limit or string/array length constraint. */
	| "VALUE_TOO_LARGE"
	/** The variable value did not match the specified regular expression (regex) pattern constraint. */
	| "PATTERN_MISMATCH"
	/** The variable value is not in a valid format (e.g., failed email or UUID format validation). */
	| "INVALID_FORMAT"
	/** An undeclared key was found in the environment, and the schema config is set to reject undeclared keys. */
	| "UNDECLARED_KEY"
	/** The provided validation schema definition itself is malformed or invalid. */
	| "INVALID_SCHEMA"
	/** A validation error was triggered by a custom validator function or inline pipe logic. */
	| "CUSTOM";

/**
 * Metadata associated with an environment validation issue.
 */
export type EnvIssueMeta = {
	/** The minimum expected boundary for numeric/string length constraints */
	min?: number;
	/** The maximum expected boundary for numeric/string length constraints */
	max?: number;
	/** Additional validation pattern/specifier details */
	validation?: string;
	/** Any custom constraint descriptions */
	constraint?: string;
	/** Traversal error occurred during JSON-parsing of the environment variable */
	traversalError?: string;
};

/**
 * Normalized validation issue representing a failure on a specific environment variable.
 */
export type EnvIssue = {
	/** The dot-separated property path/name of the environment variable */
	path: string;
	/** The descriptive, user-friendly error message */
	message: string;
	/** The normalized classification code for the issue */
	code: EnvIssueCode;
	/** The expected type or value shape description */
	expected?: string;
	/** The raw value received (redacted in string formatting if sensitive) */
	received?: unknown;
	/** Additional validation metadata */
	meta?: EnvIssueMeta;
};

/**
 * Format a list of normalized environment issues into a single styled string.
 *
 * @param issues - The array of normalized issues to format
 * @returns The formatted and styled error report string
 */
export function formatIssues(issues: EnvIssue[]): string {
	return issues
		.map((issue) => {
			const pathStr = styleText("yellow", issue.path);
			const messageStr = issue.message.trimStart();
			return `${pathStr} ${messageStr}`;
		})
		.join("\n");
}

/**
 * Error thrown when environment variable validation fails.
 *
 * This error extends the native `Error` class and provides formatted error messages
 * that clearly indicate which environment variables are invalid and why.
 *
 * @example
 * ```ts
 * import arkenv from 'arkenv';
 * import { ArkEnvError } from 'arkenv/core';
 *
 * try {
 *   const env = arkenv({
 *     PORT: 'number.port',
 *     HOST: 'string.host',
 *   });
 * } catch (error) {
 *   if (error instanceof ArkEnvError) {
 *     console.error('Environment validation failed:', error.message);
 *   }
 * }
 * ```
 */
export class ArkEnvError extends Error {
	/** The list of normalized issues that caused the validation failure */
	readonly issues: EnvIssue[];

	constructor(
		issues: EnvIssue[],
		message = "Errors found while validating environment variables",
	) {
		const formattedIssues = formatIssues(issues);
		super(`${styleText("red", message)}\n${indent(formattedIssues)}\n`);
		this.name = "ArkEnvError";
		this.issues = issues;
	}
}

Object.defineProperty(ArkEnvError, "name", { value: "ArkEnvError" });

/**
 * Result of a non-throwing arkenv parse operation.
 */
export type SafeArkEnvResult<T> =
	| { success: true; data: T }
	| { success: false; issues: readonly EnvIssue[] };
