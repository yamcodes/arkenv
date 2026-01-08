import { indent } from "./utils/indent";
import { styleText } from "./utils/style-text";

/**
 * Normalized issue format for ArkEnv.
 * This is the STABLE INTERNAL INVARIANT for error reporting.
 * All validators must eventually project their errors into this shape.
 * @internal
 */
export type EnvIssue = {
	path: string[];
	message: string;
	validator: "arktype" | "standard";
};

export class ArkEnvError extends Error {
	constructor(
		errors: EnvIssue[] | any,
		message = "Errors found while validating environment variables",
	) {
		super(`${styleText("red", message)}\n${indent(formatErrors(errors))}\n`);
		this.name = "ArkEnvError";
	}
}

Object.defineProperty(ArkEnvError, "name", { value: "ArkEnvError" });

/**
 * Format the errors for display.
 * While this function accepts `any` for backward compatibility and lazy-loading
 * flexibility, it primarily operates on the `EnvIssue` stable shape.
 *
 * @param errors - The errors found during validation (expected: EnvIssue[])
 * @returns A string of the formatted errors
 */
export function formatErrors(errors: any): string {
	if (Array.isArray(errors)) {
		return (errors as EnvIssue[])
			.map((err) => {
				const path = err.path?.length > 0 ? err.path.join(".") : "root";
				let message = err.message;
				if (message.startsWith(`${path} `)) {
					message = message.slice(path.length + 1);
				}
				return `${styleText("yellow", path)} ${message}`;
			})
			.join("\n");
	}

	return Object.entries((errors as any).byPath || {})
		.map(([path, error]: [string, any]) => {
			const messageWithoutPath = error.message.startsWith(path)
				? error.message.slice(path.length)
				: error.message;

			return `${styleText("yellow", path)} ${messageWithoutPath.trimStart()}`;
		})
		.join("\n");
}
