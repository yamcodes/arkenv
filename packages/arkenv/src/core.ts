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

const SENSITIVE_KEYWORDS = [
	/secret/i,
	/(_|^)key(_|$)/i,
	/token/i,
	/(_|^)password(_|$)/i,
	/(_|^)pass(_|$)/i,
	/(_|^)auth(_|$)/i,
	/jwt/i,
	/cert/i,
	/credential/i,
	/database_url/i,
	/db_url/i,
];

export function shouldRedact(path: string): boolean {
	const isSensitive = SENSITIVE_KEYWORDS.some((regex) => regex.test(path));
	const isPublic = /public/i.test(path);
	return isSensitive && !isPublic;
}

export function safeStringify(
	val: unknown,
	path: string,
	options?: { debugSecrets?: boolean },
): string {
	const debugSecrets =
		options?.debugSecrets ??
		(typeof process !== "undefined" &&
			(process.env.ARKENV_DEBUG_SECRETS === "true" ||
				process.env.ARKENV_DEBUG_SECRETS === "1"));

	if (val === undefined) return "missing";
	if (val === null) return "null";

	if (!debugSecrets && shouldRedact(path)) {
		return "[REDACTED]";
	}

	if (typeof val === "string") return JSON.stringify(val);
	if (
		typeof val === "number" ||
		typeof val === "boolean" ||
		typeof val === "bigint"
	) {
		return String(val);
	}
	if (typeof val === "symbol") return val.toString();
	if (typeof val === "function") return "[Function]";

	try {
		if (Array.isArray(val)) {
			if (val.length > 3) {
				return `[${val
					.slice(0, 3)
					.map((item) => safeStringify(item, path, options))
					.join(", ")}, ...(+${val.length - 3} more)]`;
			}
			return `[${val.map((item) => safeStringify(item, path, options)).join(", ")}]`;
		}
		const keys = Object.keys(val as object);
		if (keys.length > 3) {
			const slicedKeys = keys.slice(0, 3);
			const parts = slicedKeys.map(
				(k) => `${k}: ${safeStringify((val as any)[k], path, options)}`,
			);
			return `{ ${parts.join(", ")}, ...(+${keys.length - 3} more) }`;
		}
		const parts = keys.map(
			(k) => `${k}: ${safeStringify((val as any)[k], path, options)}`,
		);
		return `{ ${parts.join(", ")} }`;
	} catch {
		return Object.prototype.toString.call(val);
	}
}

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
