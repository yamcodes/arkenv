import pc from "picocolors";
import { version } from "../../package.json";
import type { CLI } from "../cli";

export class HelpCommand {
	constructor(private cli: CLI) {}

	async run() {
		const { logger } = this.cli;
		logger.log(`ArkEnv CLI v${version}`);
		logger.log(`\n${pc.bold("Usage:")}`);
		logger.log("  arkenv init    Set up ArkEnv in your project");
		logger.log(`\n${pc.bold("Options:")}`);
		logger.log("  --yes, -y      Skip prompts and use recommended defaults");
		logger.log("  --agent, -a    Agent mode: --yes --quiet --json");
		logger.log("  --quiet, -q    Suppress spinners and ANSI colors");
		logger.log("  --json, -j     Output structured JSON to stdout");
		logger.log("  --help, -h     Show this help message");
	}
}
