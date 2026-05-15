import pc from "picocolors";
import { version } from "../../../package.json";
import type { LoggerPort } from "../../shared/ports/logger.port";

export class HelpUseCase {
	constructor(private readonly logger: LoggerPort) {}

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
			"  --quiet, -q    Quiet mode: Suppress output, capture logs on failure",
		);
		this.logger.log("  --json, -j     Output structured JSON to stdout");
		this.logger.log("  --help, -h     Show this help message");
	}
}
