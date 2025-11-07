import type { ArkErrors } from "arktype";
import { styleText } from "./style-text";
import { indent } from "./utils";

/**
 * Format the errors returned by ArkType to be more readable
 * @param errors - The errors returned by ArkType
 * @returns A string of the formatted errors
 */
export const formatErrors = (errors: ArkErrors): string =>
	Object.entries(errors.byPath)
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

			return `${styleText("yellow", path)}${formattedMessage}`;
		})
		.join("\n");

export class ArkEnvError extends Error {
	constructor(
		errors: ArkErrors,
		message = "Errors found while validating environment variables",
	) {
		super(`${styleText("red", message)}\n${indent(formatErrors(errors))}\n`);
		this.name = "ArkEnvError";
	}
}
