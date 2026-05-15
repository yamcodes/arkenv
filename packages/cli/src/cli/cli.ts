import { Logger } from "@/adapters";

/**
 * Main CLI class that parses arguments and sets up the global execution context.
 */
export class CLI {
	public args: string[];
	public command: string;
	public isYes: boolean;
	public isQuiet: boolean;
	public isJson: boolean;
	public isAgent: boolean;
	public helpRequested: boolean;
	public logger: Logger;

	constructor(argv: string[], options: { logger?: Logger } = {}) {
		this.args = argv.slice(2);
		this.command = this.args[0];
		this.isYes = this.args.includes("--yes") || this.args.includes("-y");
		this.isQuiet = this.args.includes("--quiet") || this.args.includes("-q");
		this.isJson = this.args.includes("--json") || this.args.includes("-j");
		this.isAgent = this.args.includes("--agent") || this.args.includes("-a");
		this.helpRequested =
			this.args.includes("--help") || this.args.includes("-h");

		if (this.isAgent) {
			this.isYes = true;
			this.isQuiet = true;
			this.isJson = true;
		}

		this.logger =
			options.logger ||
			new Logger({
				isQuiet: this.isQuiet,
				isJson: this.isJson,
				isYes: this.isYes,
			});
	}
}
