import type { ArkErrors } from "arktype";
import { indent, styleText } from "./utils";

/**
 * Common issue shape for environment validation
 */
export type EnvIssue = {
	path: string[];
	message: string;
};

/**
 * Format the errors returned by ArkType or Standard Schema to be more readable
 * @param errors - The errors returned by the validator
 * @returns A string of the formatted errors
 */
export const formatErrors = (errors: ArkErrors | EnvIssue[]): string => {
	if (Array.isArray(errors)) {
		return errors
			.map((err) => {
				const path = err.path.length > 0 ? err.path.join(".") : "root";
				let message = err.message;

				// Consistent with ArkType: if message starts with path, trim it
				if (message.startsWith(`${path} `)) {
					message = message.slice(path.length + 1);
				}

				return `${styleText("yellow", path)} ${message}`;
			})
			.join("\n");
	}

	return Object.entries(errors.byPath)
		.map(([path, error]) => {
			const messageWithoutPath = error.message.startsWith(path)
				? error.message.slice(path.length)
				: error.message;

			// Extract the value in parentheses if it exists
			const valueMatch = messageWithoutPath.match(/\(was "([^"]+)"\)/);
			const formattedMessage = valueMatch
				? messageWithoutPath.replace(
						`(was "${valueMatch[1]}")`,
						`(was ${styleText("cyan", `"${valueMatch[1]}"`)})`,
					)
				: messageWithoutPath;

			return `${styleText("yellow", path)} ${formattedMessage.trimStart()}`;
		})
		.join("\n");
};

export class ArkEnvError extends Error {
	constructor(
		errors: ArkErrors | EnvIssue[],
		message = "Errors found while validating environment variables",
	) {
		super(`${styleText("red", message)}\n${indent(formatErrors(errors))}\n`);
		this.name = "ArkEnvError";
	}
}

Object.defineProperty(ArkEnvError, "name", { value: "ArkEnvError" });
