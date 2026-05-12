import { cancel, spinner as clackSpinner, outro } from "@clack/prompts";
import pc from "picocolors";

export type LoggerOptions = {
	isQuiet: boolean;
	isJson: boolean;
	isYes?: boolean;
};

export class Logger {
	private originalStdoutWrite = process.stdout.write;

	constructor(private options: LoggerOptions) {}

	private format(message: string): string {
		if (this.options.isQuiet) {
			// Strip ANSI codes if we want truly clean output
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

	get stdio() {
		return this.options.isJson
			? ([process.stdin, process.stderr, process.stderr] as const)
			: ("inherit" as const);
	}

	interactiveStdout(enable: boolean) {
		if (!this.options.isJson || this.options.isYes) return;

		if (enable) {
			process.stdout.write = process.stderr.write.bind(process.stderr);
		} else {
			process.stdout.write = this.originalStdoutWrite;
		}
	}

	cancel(message: string) {
		if (this.options.isJson) {
			this.json({
				status: "error",
				message,
			});
		} else {
			cancel(message);
		}
		process.exit(0);
	}

	fatal(message: string, error?: unknown) {
		if (this.options.isJson) {
			this.json({
				status: "error",
				message,
				error: error instanceof Error ? error.message : String(error),
			});
		} else {
			this.error(message);
			if (error) {
				this.log(pc.red(error instanceof Error ? error.stack! : String(error)));
			}
		}
		process.exit(1);
	}

	finish(message: string, details?: Record<string, any>) {
		if (this.options.isJson) {
			this.json({
				status: "success",
				message,
				details,
			});
		} else {
			outro(message);
		}
	}
}
