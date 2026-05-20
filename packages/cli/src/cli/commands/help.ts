import pc from "picocolors";
import type { LoggerPort } from "@/shared/ports";
import { version } from "../../../package.json";

/**
 * Use case for displaying the CLI help message.
 */
export class HelpUseCase {
	/**
	 * Creates the help use case with the logger used for CLI output.
	 */
	constructor(private readonly logger: LoggerPort) {}

	/**
	 * Writes the CLI help text to the configured logger.
	 */
	async execute() {
		this.logger.log(`ArkEnv CLI v${version}`);
		this.logger.log(`\n${pc.bold("Usage:")}`);
		this.logger.log("  arkenv init    Set up ArkEnv in your project");
		this.logger.log(`\n${pc.bold("Options:")}`);
		this.logger.log(
			"  --yes, -y      Skip prompts and use defaults (also passed to skill processes)",
		);
		this.logger.log("  --agent, -a    Agent mode: --yes --quiet --json");
		this.logger.log(
			"  --template, -t Specify a template ID to scaffold from (New Project Flow)",
		);
		this.logger.log(
			"  --name, -n     Specify the project name (New Project Flow)",
		);
		this.logger.log(
			"  --quiet, -q    Quiet mode: Suppress output, capture logs on failure",
		);
		this.logger.log("  --json, -j     Output structured JSON to stdout");
		this.logger.log("  --help, -h     Show this help message");
	}
}
