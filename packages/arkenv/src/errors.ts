import { indent } from "./utils/indent";
import { styleText } from "./utils/style-text";

export type EnvIssue = {
	path: string[];
	message: string;
};

export class ArkEnvError extends Error {
	constructor(
		errors: any,
		message = "Errors found while validating environment variables",
	) {
		super(`${styleText("red", message)}\n${indent(formatErrors(errors))}\n`);
		this.name = "ArkEnvError";
	}
}

Object.defineProperty(ArkEnvError, "name", { value: "ArkEnvError" });

export function formatErrors(errors: any): string {
	if (Array.isArray(errors)) {
		return errors
			.map((err: any) => {
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
