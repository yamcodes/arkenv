import { Logger } from "@/adapters";
import { type HostPreset, isHostPreset } from "@/features/scaffold/presets";
import type { CheckInput } from "./commands/check";
import type { InitInput } from "./commands/init";

const FLAG_CONFIG = {
	isYes: { long: "--yes", short: "-y", kind: "boolean" },
	isForce: { long: "--force", short: "-f", kind: "boolean" },
	isQuiet: { long: "--quiet", short: "-q", kind: "boolean" },
	isJson: { long: "--json", short: "-j", kind: "boolean" },
	isAgent: { long: "--agent", short: "", kind: "boolean" },
	helpRequested: { long: "--help", short: "-h", kind: "boolean" },
	// `-e` is intentionally reserved: it universally means `--env`/`--environment`
	// elsewhere, so it must never be aliased to `--example` (or any other flag).
	// Keeping it unassigned makes `-e` fail fast as an unknown argument.
	example: { long: "--example", short: "", kind: "value" },
	noCodegen: { long: "--no-codegen", short: "", kind: "boolean" },
	preset: { long: "--preset", short: "-P", kind: "value" },
	hostPreset: { long: "--host-preset", short: "-H", kind: "value" },
	schema: { long: "--schema", short: "-s", kind: "value" },
	envFile: { long: "--env-file", short: "", kind: "value" },
	verifyExample: {
		long: "--verify-example",
		short: "",
		kind: "optional-value",
	},
} as const;

const knownFlags = new Set<string>(
	Object.values(FLAG_CONFIG).flatMap((f) => [f.long, f.short].filter(Boolean)),
);

const valuedFlags = new Set<string>(
	Object.values(FLAG_CONFIG)
		.filter((f) => f.kind === "value")
		.flatMap((f) => [f.long, f.short].filter(Boolean)),
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
	public positionalArgs: string[];
	private verifyExampleValue: boolean | string | undefined;

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
				if (arg === FLAG_CONFIG.verifyExample.long) {
					if (i + 1 < this.args.length && !this.args[i + 1].startsWith("-")) {
						this.verifyExampleValue = this.args[i + 1];
						i += 2;
					} else {
						this.verifyExampleValue = true;
						i += 1;
					}
				} else if (valuedFlags.has(arg)) {
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
			const rawPresetVal =
				this.getFlagValue(FLAG_CONFIG.preset.long, FLAG_CONFIG.preset.short) ??
				this.getFlagValue(
					FLAG_CONFIG.hostPreset.long,
					FLAG_CONFIG.hostPreset.short,
				);
			if (rawPresetVal !== undefined && !isHostPreset(rawPresetVal)) {
				this.validationError = `Invalid host preset: ${rawPresetVal}`;
			}
		}

		this.positionalArgs = positionalArgs;

			if (this.command === "check") {
				if (positionalArgs.length > 0) {
					this.validationError = `Unknown argument: ${positionalArgs[0]}`;
				}
			} else {
				if (positionalArgs.length > 1) {
					this.validationError = `Unknown argument: ${positionalArgs[1]}`;
				} else {
					this.name = positionalArgs[0];
				}
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

	get schema(): string | undefined {
		const flag = FLAG_CONFIG.schema;
		return this.getFlagValue(flag.long, flag.short);
	}

	get envFiles(): string[] {
		const flag = FLAG_CONFIG.envFile;
		return this.getFlagValues(flag.long, flag.short);
	}

	get verifyExample(): boolean | string | undefined {
		return this.verifyExampleValue;
	}

	get hostPreset(): HostPreset | undefined {
		const val =
			this.getFlagValue(FLAG_CONFIG.preset.long, FLAG_CONFIG.preset.short) ??
			this.getFlagValue(
				FLAG_CONFIG.hostPreset.long,
				FLAG_CONFIG.hostPreset.short,
			);
		if (val && isHostPreset(val)) {
			return val;
		}
		return undefined;
	}

	private hasFlag(prop: keyof typeof FLAG_CONFIG): boolean {
		const flag = FLAG_CONFIG[prop];
		return (
			this.args.includes(flag.long) ||
			(!!flag.short && this.args.includes(flag.short))
		);
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
		if (this.hostPreset !== undefined) {
			input.hostPreset = this.hostPreset;
		}
		return input;
	}

	get checkInput(): CheckInput {
		return {
			...(this.schema !== undefined
				? { schema: this.schema, file: this.schema }
				: {}),
			...(this.envFiles.length > 0 ? { envFiles: this.envFiles } : {}),
			...(this.verifyExample !== undefined
				? { verifyExample: this.verifyExample }
				: {}),
			isQuiet: this.isQuiet,
			isJson: this.isJson,
			isAgent: this.isAgent,
			isYes: this.isYes,
			isForce: this.isForce,
		};
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

	/**
	 * Returns all values passed to a repeatable long or short CLI flag, in order.
	 */
	private getFlagValues(long: string, short?: string): string[] {
		const values: string[] = [];
		for (let i = 0; i < this.args.length - 1; i++) {
			const arg = this.args[i];
			if (
				(arg === long || (Boolean(short) && arg === short)) &&
				!this.args[i + 1].startsWith("-")
			) {
				values.push(this.args[i + 1]);
			}
		}
		return values;
	}
}
