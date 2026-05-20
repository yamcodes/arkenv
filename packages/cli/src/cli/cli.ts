import { Logger } from "@/adapters";
import type { InitInput } from "./commands/init";

/**
 * Main CLI class that parses arguments and sets up the global execution context.
 */
export class CLI {
	public args: string[];
	public command: string;
	public isYes: boolean;
	public isForce: boolean;
	public isQuiet: boolean;
	public isJson: boolean;
	public isAgent: boolean;
	public helpRequested: boolean;
	public template: string | undefined;
	public name: string | undefined;
	public logger: Logger;

	/**
	 * Creates a CLI context from process arguments and optional adapters.
	 */
	constructor(argv: string[], options: { logger?: Logger } = {}) {
		this.args = argv.slice(2);
		this.command = this.args[0];
		this.isYes = this.args.includes("--yes") || this.args.includes("-y");
		this.isForce = this.args.includes("--force") || this.args.includes("-f");
		this.isQuiet = this.args.includes("--quiet") || this.args.includes("-q");
		this.isJson = this.args.includes("--json") || this.args.includes("-j");
		this.isAgent = this.args.includes("--agent") || this.args.includes("-a");
		this.helpRequested =
			this.args.includes("--help") || this.args.includes("-h");

		this.template = this.getFlagValue("--template", "-t");
		this.name = this.getFlagValue("--name", "-n");

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

	/**
	 * Returns the parsed input consumed by the init command.
	 */
	get initInput(): InitInput {
		const input: InitInput = {
			isYes: this.isYes,
			isForce: this.isForce,
			isQuiet: this.isQuiet,
			isAgent: this.isAgent,
		};
		if (this.template !== undefined) {
			input.template = this.template;
		}
		if (this.name !== undefined) {
			input.name = this.name;
		}
		return input;
	}

	/**
	 * Returns the value passed to a long or short CLI flag.
	 */
	private getFlagValue(long: string, short: string): string | undefined {
		const index = this.args.findIndex((a) => a === long || a === short);
		if (
			index !== -1 &&
			this.args[index + 1] &&
			!this.args[index + 1].startsWith("-")
		) {
			return this.args[index + 1];
		}
		return undefined;
	}
}
