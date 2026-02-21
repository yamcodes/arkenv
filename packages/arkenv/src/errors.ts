import type { ArkErrors } from "arktype";
import { indent } from "./utils/indent.ts";
import { styleText } from "./utils/style-text.ts";

export type ValidationIssue = {
	path: string;
	message: string;
};

/**
 * Check if the provided object is ArkType errors
 */
const isArkErrors = (errors: unknown): errors is ArkErrors => {
	return (
		errors !== null &&
		typeof errors === "object" &&
		"byPath" in (errors as Record<string, unknown>)
	);
};

/**
 * Format the errors returned by ArkType to be more readable
 * @param errors - The errors returned by ArkType
 * @returns A string of the formatted errors
 */
export const formatArkErrors = (errors: ArkErrors): string => {
	return Object.entries(errors.byPath)
		.map(([path, error]) => {
			let message = error.message;

			const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const pathRegex = new RegExp(
				`^\\s*[:.-]?\\s*${escapedPath}\\s*[:.-]?\\s*`,
				"i",
			);

			if (pathRegex.test(message)) {
				// Style the existing path prefix
				message = message.replace(pathRegex, (match) => {
					return `${styleText("yellow", path)}${match.toLowerCase().replace(path.toLowerCase(), "")}`;
				});
			} else {
				// Prepend styled path
				message = `${styleText("yellow", path)} ${message}`;
			}

			// Style (was ...)
			const valueMatch = message.match(/\(was (.*)\)/);
			if (valueMatch?.[1]) {
				const value = valueMatch[1];
				if (!value.includes("\x1b[")) {
					const styledValue = styleText("cyan", value);
					message = message.replace(`(was ${value})`, `(was ${styledValue})`);
				}
			}

			return message;
		})
		.join("\n");
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
 * import { createEnv, ArkEnvError } from 'arkenv';
 *
 * try {
 *   const env = createEnv({
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
		errors: ArkErrors | ValidationIssue[],
		message = "Errors found while validating environment variables",
	) {
		// ArkType errors subclass Array, so we must check for ArkErrors specifically first
		const formattedErrors = isArkErrors(errors)
			? formatArkErrors(errors)
			: formatInternalErrors(errors as ValidationIssue[]);

		super(`${styleText("red", message)}\n${indent(formattedErrors)}\n`);
		this.name = "ArkEnvError";
	}
}

Object.defineProperty(ArkEnvError, "name", { value: "ArkEnvError" });
