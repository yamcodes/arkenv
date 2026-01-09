import { indent } from "./utils/indent";
import { styleText } from "./utils/style-text";

export type EnvIssue = {
	path: string[];
	message: string;
};

export class ArkEnvError extends Error {
	constructor(
		errors: EnvIssue[],
		message = "Errors found while validating environment variables",
	) {
		super(`${styleText("red", message)}\n${indent(formatErrors(errors))}\n`);
		this.name = "ArkEnvError";
	}
}

Object.defineProperty(ArkEnvError, "name", { value: "ArkEnvError" });

export function formatErrors(errors: EnvIssue[]): string {
	return errors
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
