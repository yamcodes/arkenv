import type { EnvIssue } from "./adapters";
import { indent } from "./utils/indent";
import { styleText } from "./utils/style-text";

export class ArkEnvError extends Error {
	public issues: EnvIssue[];

	constructor(
		issues: EnvIssue[] | any,
		message = "Errors found while validating environment variables",
	) {
		const normalizedIssues = Array.isArray(issues)
			? issues
			: Object.entries((issues as any).byPath || {}).map(
					([path, error]: [string, any]) => ({
						path: path ? path.split(".") : [],
						message: error.message,
						validator: "arktype" as const,
					}),
				);

		super(
			`${styleText("red", message)}\n${indent(formatIssues(normalizedIssues))}\n`,
		);
		this.name = "ArkEnvError";
		this.issues = normalizedIssues;
	}
}

/**
 * @deprecated Use ArkEnvError.issues or normalized format.
 * Maintained for backward compatibility with existing tests and users.
 */
export function formatErrors(errors: any): string {
	const issues = Object.entries(errors.byPath || {}).map(
		([path, error]: [string, any]) => ({
			path: path ? path.split(".") : [],
			message: error.message,
			validator: "arktype" as const,
		}),
	);
	return formatIssues(issues);
}

function formatIssues(issues: EnvIssue[]): string {
	return issues
		.map((issue) => {
			const path = issue.path.length > 0 ? issue.path.join(".") : "root";
			let message = issue.message;
			// ArkType's error messages often already include the path.
			// Example: "PORT must be a number".
			// We want to avoid "PORT: PORT must be a number".
			if (message.startsWith(`${path} `)) {
				message = message.slice(path.length + 1);
			}
			return `${styleText("yellow", path)} ${message}`;
		})
		.join("\n");
}
