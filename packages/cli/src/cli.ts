import { version } from "../package.json";
import { Logger } from "./visuals";

export class CLI {
	public args: string[];
	public command: string;
	public isYes: boolean;
	public isQuiet: boolean;
	public isJson: boolean;
	public isAgent: boolean;
	public helpRequested: boolean;
	public logger: Logger;

	constructor(argv: string[]) {
		this.args = argv.slice(2);
		this.command = this.args[0];
		this.isYes = this.args.includes("--yes") || this.args.includes("-y");
		this.isQuiet = this.args.includes("--quiet") || this.args.includes("-q");
		this.isJson = this.args.includes("--json") || this.args.includes("-j");
		this.isAgent = this.args.includes("--agent") || this.args.includes("-a");
		this.helpRequested = this.args.includes("--help") || this.args.includes("-h");

		if (this.isAgent) {
			this.isYes = true;
			this.isQuiet = true;
			this.isJson = true;
		}

		this.logger = new Logger({
			isQuiet: this.isQuiet,
			isJson: this.isJson,
			isYes: this.isYes,
		});
	}

	printHelp() {
		this.logger.log(`ArkEnv CLI v${version}`);
		this.logger.log("\nUsage:");
		this.logger.log("  arkenv init    Set up ArkEnv in your project");
		this.logger.log("\nOptions:");
		this.logger.log("  --yes, -y      Skip prompts and use recommended defaults");
		this.logger.log("  --agent, -a    Agent mode: --yes --quiet --json");
		this.logger.log("  --quiet, -q    Suppress spinners and ANSI colors");
		this.logger.log("  --json, -j     Output structured JSON to stdout");
		this.logger.log("  --help, -h     Show this help message");
	}
}
