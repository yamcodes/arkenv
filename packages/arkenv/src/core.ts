import { indent } from "./utils/indent.ts";
import { styleText } from "./utils/style-text.ts";

/**
 * A single validation issue produced during environment variable parsing.
 * Used by {@link ArkEnvError} to report which key failed and why.
 */
export type ValidationIssue = {
	path: string;
	message: string;
};

export const formatInternalErrors = (errors: ValidationIssue[]): string =>
	errors
		.map(
			(error) =>
				`${styleText("yellow", error.path)} ${error.message.trimStart()}`,
		)
		.join("\n");

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
	constructor(
		errors: ValidationIssue[],
		message = "Errors found while validating environment variables",
	) {
		const formattedErrors = formatInternalErrors(errors);
		super(`${styleText("red", message)}\n${indent(formattedErrors)}\n`);
		this.name = "ArkEnvError";
	}
}

Object.defineProperty(ArkEnvError, "name", { value: "ArkEnvError" });
