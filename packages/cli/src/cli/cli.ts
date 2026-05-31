import { Logger } from "@/adapters";
import type { InitInput } from "./commands/init";

const FLAG_CONFIG = {
	isYes: { long: "--yes", short: "-y", kind: "boolean" },
	isForce: { long: "--force", short: "-f", kind: "boolean" },
	isQuiet: { long: "--quiet", short: "-q", kind: "boolean" },
	isJson: { long: "--json", short: "-j", kind: "boolean" },
	isAgent: { long: "--agent", short: "-a", kind: "boolean" },
	helpRequested: { long: "--help", short: "-h", kind: "boolean" },
	example: { long: "--example", short: "-e", kind: "value" },
	noCodegen: { long: "--no-codegen", short: "-C", kind: "boolean" },
} as const;

const knownFlags = new Set<string>(
	Object.values(FLAG_CONFIG).flatMap((f) => [f.long, f.short]),
);

const valuedFlags = new Set<string>(
	Object.values(FLAG_CONFIG)
		.filter((f) => f.kind === "value")
		.flatMap((f) => [f.long, f.short]),
);

/**
 * Main CLI class that parses arguments and sets up the global execution context.
 */
export class CLI {
	public args: string[];
	public command: string;
	public name: string | undefined;
	public validationError: string | undefined;
	public logger: Logger;

	/**
	 * Creates a CLI context from process arguments and optional adapters.
	 */
	constructor(argv: string[], options: { logger?: Logger } = {}) {
		const rawArgs = argv.slice(2);
		const expandedArgs: string[] = [];
		let skipNext = false;

		for (const arg of rawArgs) {
			if (skipNext) {
				expandedArgs.push(arg);
				skipNext = false;
				continue;
			}

			if (valuedFlags.has(arg)) {
				expandedArgs.push(arg);
				skipNext = true;
				continue;
			}

			if (/^-[a-zA-Z]{2,}$/.test(arg)) {
				const chars = arg.slice(1).split("");
				for (const char of chars) {
					expandedArgs.push(`-${char}`);
				}
				if (valuedFlags.has(`-${chars[chars.length - 1]}`)) {
					skipNext = true;
				}
			} else {
				expandedArgs.push(arg);
			}
		}

		this.args = expandedArgs;
		this.command = this.args[0];

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
						this.validationError = `Missing value for option: ${arg}`;
						break;
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

		this.logger =
			options.logger ||
			new Logger({
				isQuiet: this.isQuiet,
				isJson: this.isJson,
				isYes: this.isYes,
			});
	}

	get isAgent(): boolean {
		return this.hasFlag("isAgent");
	}

	get isYes(): boolean {
		return this.isAgent || this.hasFlag("isYes");
	}

	get isQuiet(): boolean {
		return this.isAgent || this.hasFlag("isQuiet");
	}

	get isJson(): boolean {
		return this.isAgent || this.hasFlag("isJson");
	}

	get isForce(): boolean {
		return this.hasFlag("isForce");
	}

	get helpRequested(): boolean {
		return this.hasFlag("helpRequested");
	}

	get example(): string | undefined {
		const flag = FLAG_CONFIG.example;
		return this.getFlagValue(flag.long, flag.short);
	}

	get noCodegen(): boolean {
		return this.hasFlag("noCodegen");
	}

	private hasFlag(prop: keyof typeof FLAG_CONFIG): boolean {
		const flag = FLAG_CONFIG[prop];
		return this.args.includes(flag.long) || this.args.includes(flag.short);
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
		if (this.noCodegen) {
			input.noCodegen = true;
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
