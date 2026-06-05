import { indent } from "./utils/indent.ts";
import { styleText } from "./utils/style-text.ts";

export type EnvIssueCode =
	| "MISSING_VARIABLE"
	| "INVALID_TYPE"
	| "VALUE_TOO_SMALL"
	| "VALUE_TOO_LARGE"
	| "PATTERN_MISMATCH"
	| "INVALID_FORMAT"
	| "UNDECLARED_KEY"
	| "INVALID_SCHEMA"
	| "CUSTOM";

export type EnvIssueMeta = {
	min?: number;
	max?: number;
	validation?: string;
	constraint?: string;
	engineCode?: string;
	engine: "arktype" | "zod" | "valibot" | "unknown";
	traversalError?: string;
};

export type EnvIssue = {
	path: string;
	message: string;
	code: EnvIssueCode;
	expected?: string;
	received?: unknown;
	meta?: EnvIssueMeta;
};

/**
 * @deprecated Use EnvIssue instead
 */
export type ValidationIssue = EnvIssue;

export function formatIssues(issues: EnvIssue[]): string {
	return issues
		.map((issue) => {
			const pathStr = styleText("yellow", issue.path);
			const messageStr = issue.message.trimStart();
			return `${pathStr} ${messageStr}`;
		})
		.join("\n");
}

export function formatError(error: ArkEnvError | EnvIssue[]): string {
	if (Array.isArray(error)) {
		return formatIssues(error);
	}
	return formatIssues(error.issues);
}

/**
 * @deprecated Use formatIssues instead
 */
export const formatInternalErrors = (errors: ValidationIssue[]): string =>
	formatIssues(errors);

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
	readonly issues: EnvIssue[];

	constructor(
		issues: EnvIssue[],
		message = "Errors found while validating environment variables",
	) {
		const formattedErrors = formatIssues(issues);
		super(`${styleText("red", message)}\n${indent(formattedErrors)}\n`);
		this.name = "ArkEnvError";
		this.issues = issues;
	}
}

Object.defineProperty(ArkEnvError, "name", { value: "ArkEnvError" });
