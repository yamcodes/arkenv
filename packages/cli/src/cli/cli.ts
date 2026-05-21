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
	public example: string | undefined;
	public name: string | undefined;
	public validationError: string | undefined;
	public logger: Logger;

	/**
	 * Creates a CLI context from process arguments and optional adapters.
	 */
	constructor(argv: string[], options: { logger?: Logger } = {}) {
		const rawArgs = argv.slice(2);
		const expandedArgs: string[] = [];
		const expansionValuedFlags = new Set(["--example", "-e", "--name", "-n"]);
		let skipNext = false;

		for (const arg of rawArgs) {
			if (skipNext) {
				expandedArgs.push(arg);
				skipNext = false;
				continue;
			}

			if (expansionValuedFlags.has(arg)) {
				expandedArgs.push(arg);
				skipNext = true;
				continue;
			}

			if (/^-[a-zA-Z]{2,}$/.test(arg)) {
				const chars = arg.slice(1).split("");
				for (const char of chars) {
					expandedArgs.push(`-${char}`);
				}
				if (expansionValuedFlags.has(`-${chars[chars.length - 1]}`)) {
					skipNext = true;
				}
			} else {
				expandedArgs.push(arg);
			}
		}

		this.args = expandedArgs;
		this.command = this.args[0];
		this.isYes = this.args.includes("--yes") || this.args.includes("-y");
		this.isForce = this.args.includes("--force") || this.args.includes("-f");
		this.isQuiet = this.args.includes("--quiet") || this.args.includes("-q");
		this.isJson = this.args.includes("--json") || this.args.includes("-j");
		this.isAgent = this.args.includes("--agent") || this.args.includes("-a");
		this.helpRequested =
			this.args.includes("--help") || this.args.includes("-h");

		this.example = this.getFlagValue("--example", "-e");

		const knownFlags = new Set([
			"--yes",
			"-y",
			"--force",
			"-f",
			"--quiet",
			"-q",
			"--json",
			"-j",
			"--agent",
			"-a",
			"--help",
			"-h",
			"--example",
			"-e",
		]);

		const valuedFlags = new Set(["--example", "-e"]);

		let i = 1;
		const positionalArgs: string[] = [];
		this.validationError = undefined;

		while (i < this.args.length) {
			const arg = this.args[i];
			if (arg.startsWith("-")) {
				if (!knownFlags.has(arg)) {
					this.validationError = `Unknown argument: ${arg}`;
					break;
				}
				if (valuedFlags.has(arg)) {
					if (i + 1 < this.args.length && !this.args[i + 1].startsWith("-")) {
						i += 2;
					} else {
						i += 1;
					}
				} else {
					i += 1;
				}
			} else {
				positionalArgs.push(arg);
				i += 1;
			}
		}

		if (!this.validationError) {
			if (positionalArgs.length > 1) {
				this.validationError = `Unknown argument: ${positionalArgs[1]}`;
			} else {
				this.name = positionalArgs[0];
			}
		}

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
		if (this.example !== undefined) {
			input.example = this.example;
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
