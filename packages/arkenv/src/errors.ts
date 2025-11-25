import type { ArkErrors } from "arktype";
import type { LoggerStyle } from "./utils";
import { indent, styleText } from "./utils";

/**
 * Format the errors returned by ArkType to be more readable
 * @param errors - The errors returned by ArkType
 * @param logger - Optional logger function for styling
 * @returns A string of the formatted errors
 */
export const formatErrors = (errors: ArkErrors, logger?: LoggerStyle): string =>
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
						`(was ${styleText("cyan", `"${valueMatch[1]}"`, logger)})`,
					)
				: messageWithoutPath;

			return `${styleText("yellow", path, logger)}${formattedMessage}`;
		})
		.join("\n");

export class ArkEnvError extends Error {
	constructor(
		errors: ArkErrors,
		message = "Errors found while validating environment variables",
		logger?: LoggerStyle,
	) {
		super(
			`${styleText("red", message, logger)}\n${indent(formatErrors(errors, logger))}\n`,
		);
		this.name = "ArkEnvError";
	}
}
