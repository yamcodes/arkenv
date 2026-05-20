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
		this.logger.log("  --force, -f    Bypass technical requirement checks and force scaffolding");
		this.logger.log("  --agent, -a    Agent mode: --yes --quiet --json");
		this.logger.log(
			"  --example, -e Specify an example ID to scaffold from (when creating a new project)",
		);
		this.logger.log(
			"  --name, -n     Specify the project name (when creating a new project)",
		);
		this.logger.log(
			"  --quiet, -q    Quiet mode: Suppress output, capture logs on failure",
		);
		this.logger.log("  --json, -j     Output structured JSON to stdout");
		this.logger.log("  --help, -h     Show this help message");
	}
}
