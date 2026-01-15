import type { ArkErrors } from "arktype";
import { indent } from "./utils/indent";
import { styleText } from "./utils/style-text";

export type InternalValidationError = {
	path: string;
	message: string;
};

/**
 * Format the errors returned by ArkType to be more readable
 * @param errors - The errors returned by ArkType
 * @returns A string of the formatted errors
 */
export const formatArkErrors = (errors: ArkErrors): string =>
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

			return `${styleText("yellow", path)} ${formattedMessage.trimStart()}`;
		})
		.join("\n");

export const formatInternalErrors = (
	errors: InternalValidationError[],
): string =>
	errors
		.map(
			(error) =>
				`${styleText("yellow", error.path)} ${error.message.trimStart()}`,
		)
		.join("\n");

export class ArkEnvError extends Error {
	constructor(
		errors: ArkErrors | InternalValidationError[],
		message = "Errors found while validating environment variables",
	) {
		const formattedErrors = Array.isArray(errors)
			? formatInternalErrors(errors)
			: formatArkErrors(errors);

		super(`${styleText("red", message)}\n${indent(formattedErrors)}\n`);
		this.name = "ArkEnvError";
	}
}

Object.defineProperty(ArkEnvError, "name", { value: "ArkEnvError" });
