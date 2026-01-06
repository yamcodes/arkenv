import type { EnvIssue } from "./adapters";
import { indent } from "./utils/indent";
import { styleText } from "./utils/style-text";

export class ArkEnvError extends Error {
	constructor(
		public issues: EnvIssue[],
		message = "Errors found while validating environment variables",
	) {
		super(`${styleText("red", message)}\n${indent(formatIssues(issues))}\n`);
		this.name = "ArkEnvError";
	}
}

function formatIssues(issues: EnvIssue[]): string {
	return issues
		.map((issue) => {
			const path = issue.path.length > 0 ? issue.path.join(".") : "root";
			let message = issue.message;
			if (message.startsWith(`${path} `)) {
				message = message.slice(path.length + 1);
			}
			return `${styleText("yellow", path)} ${message}`;
		})
		.join("\n");
}
