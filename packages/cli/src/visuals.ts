import { spinner as clackSpinner } from "@clack/prompts";
import pc from "picocolors";

/**
 * Format the given string as a code section.
 */
export const code = (str: string) => pc.cyan(str);

/**
 * The ArkEnv blue ⛯ symbol.
 */
export const symbol = pc.blue("⛯");

export type LoggerOptions = {
	isQuiet: boolean;
	isJson: boolean;
};

export class Logger {
	constructor(private options: LoggerOptions) {}

	private format(message: string): string {
		if (this.options.isQuiet) {
			// Strip ANSI codes if we want truly clean output,
			// though picocolors usually handles this if we don't use it.
			// For simplicity, we just won't use pc if isQuiet is true in our methods.
			// biome-ignore lint/suspicious/noControlCharactersInRegex: Standard ANSI escape code stripping
			return message.replace(/\x1B\[[0-9;]*[JKmsu]/g, "");
		}

		return message;
	}

	private write(message: string, type: "stdout" | "stderr" = "stdout") {
		const formatted = this.format(message);
		if (this.options.isJson || type === "stderr") {
			process.stderr.write(`${formatted}\n`);
		} else {
			process.stdout.write(`${formatted}\n`);
		}
	}

	info(message: string) {
		this.write(pc.blue(`ℹ ${message}`));
	}

	warn(message: string) {
		this.write(pc.yellow(`⚠ ${message}`), "stderr");
	}

	error(message: string) {
		this.write(pc.red(`✘ ${message}`), "stderr");
	}

	success(message: string) {
		this.write(pc.green(`✔ ${message}`));
	}

	step(message: string) {
		this.write(pc.dim(`○ ${message}`));
	}

	log(message: string) {
		this.write(message);
	}

	spinner() {
		if (this.options.isQuiet || this.options.isJson) {
			return {
				start: (msg: string) => this.write(pc.dim(`○ ${msg}...`)),
				stop: (msg: string) => this.write(pc.green(`✔ ${msg}`)),
				message: (msg: string) => this.write(pc.dim(`○ ${msg}...`)),
			};
		}
		return clackSpinner();
	}

	json(data: unknown) {
		// JSON ALWAYS goes to stdout
		process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
	}
}
