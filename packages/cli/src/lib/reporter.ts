import { cancel, spinner as clackSpinner, note, outro } from "@clack/prompts";
import pc from "picocolors";

export interface Spinner {
	start(message: string): void;
	stop(message: string): void;
	message(message: string): void;
}

export interface Reporter {
	info(message: string): void;
	warn(message: string): void;
	error(message: string): void;
	success(message: string): void;
	step(message: string): void;
	note(message: string, title?: string): void;
	log(message: string): void;
	spinner(): Spinner;
	json(data: unknown): void;
	cancel(message: string): void;
	fatal(message: string, error?: unknown): void;
	finish(message: string, details?: Record<string, any>): void;
}

export class TextReporter implements Reporter {
	info(message: string) {
		process.stdout.write(`${pc.blue(`ℹ ${message}`)}\n`);
	}

	warn(message: string) {
		process.stderr.write(`${pc.yellow(`⚠ ${message}`)}\n`);
	}

	error(message: string) {
		process.stderr.write(`${pc.red(`✘ ${message}`)}\n`);
	}

	success(message: string) {
		process.stdout.write(`${pc.green(`✔ ${message}`)}\n`);
	}

	step(message: string) {
		process.stdout.write(`○ ${message}\n`);
	}

	note(message: string, title?: string) {
		note(message, title);
	}

	log(message: string) {
		process.stdout.write(`${message}\n`);
	}

	spinner(): Spinner {
		return clackSpinner();
	}

	json(data: unknown) {
		process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
	}

	cancel(message: string) {
		cancel(message);
		process.exit(0);
	}

	fatal(message: string, error?: unknown) {
		process.stderr.write(`${pc.red(`✘ ${message}`)}\n`);
		if (error) {
			process.stderr.write(
				`${pc.red(error instanceof Error ? error.stack! : String(error))}\n`,
			);
		}
		process.exit(1);
	}

	finish(message: string, _details?: Record<string, any>) {
		outro(message);
	}
}

export class JsonReporter implements Reporter {
	info(message: string) {
		process.stderr.write(`${pc.blue(`ℹ ${message}`)}\n`);
	}

	warn(message: string) {
		process.stderr.write(`${pc.yellow(`⚠ ${message}`)}\n`);
	}

	error(message: string) {
		process.stderr.write(`${pc.red(`✘ ${message}`)}\n`);
	}

	success(message: string) {
		process.stderr.write(`${pc.green(`✔ ${message}`)}\n`);
	}

	step(message: string) {
		process.stderr.write(`○ ${message}\n`);
	}

	note(message: string, title?: string) {
		process.stderr.write(
			`${pc.dim(`○ ${title ? `${title}: ` : ""}${message}`)}\n`,
		);
	}

	log(message: string) {
		process.stderr.write(`${message}\n`);
	}

	spinner(): Spinner {
		return {
			start: (msg: string) =>
				process.stderr.write(`${pc.dim(`○ ${msg}...`)}\n`),
			stop: (msg: string) => process.stderr.write(`${pc.green(`✔ ${msg}`)}\n`),
			message: (msg: string) =>
				process.stderr.write(`${pc.dim(`○ ${msg}...`)}\n`),
		};
	}

	json(data: unknown) {
		process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
	}

	cancel(message: string) {
		this.json({
			status: "error",
			message,
		});
		process.exit(0);
	}

	fatal(message: string, error?: unknown) {
		this.json({
			status: "error",
			details: {
				message,
				error:
					error instanceof Error
						? error.message
						: error
							? String(error)
							: undefined,
			},
		});
		process.exit(1);
	}

	finish(message: string, details?: Record<string, any>) {
		this.json({
			status: "success",
			message,
			details,
		});
	}
}

export class SilentReporter implements Reporter {
	private stripAnsi(message: string): string {
		// biome-ignore lint/suspicious/noControlCharactersInRegex: Standard ANSI escape code stripping
		return message.replace(/\x1B\[[0-9;]*[JKmsu]/g, "");
	}

	info(_message: string) {}
	warn(_message: string) {}
	error(_message: string) {}
	success(_message: string) {}
	step(_message: string) {}
	note(_message: string, _title?: string) {}
	log(_message: string) {}

	spinner(): Spinner {
		return {
			start: (_msg: string) => {},
			stop: (_msg: string) => {},
			message: (_msg: string) => {},
		};
	}

	json(data: unknown) {
		process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
	}

	cancel(message: string) {
		process.exit(0);
	}

	fatal(message: string, error?: unknown) {
		process.exit(1);
	}

	finish(message: string, details?: Record<string, any>) {}
}

export class MemoryReporter implements Reporter {
	public logs: { type: string; message: string; data?: any }[] = [];

	info(message: string) {
		this.logs.push({ type: "info", message });
	}
	warn(message: string) {
		this.logs.push({ type: "warn", message });
	}
	error(message: string) {
		this.logs.push({ type: "error", message });
	}
	success(message: string) {
		this.logs.push({ type: "success", message });
	}
	step(message: string) {
		this.logs.push({ type: "step", message });
	}
	note(message: string, title?: string) {
		this.logs.push({
			type: "note",
			message: title ? `${title}: ${message}` : message,
		});
	}
	log(message: string) {
		this.logs.push({ type: "log", message });
	}

	spinner(): Spinner {
		return {
			start: (msg: string) =>
				this.logs.push({ type: "spinner:start", message: msg }),
			stop: (msg: string) =>
				this.logs.push({ type: "spinner:stop", message: msg }),
			message: (msg: string) =>
				this.logs.push({ type: "spinner:message", message: msg }),
		};
	}

	json(data: unknown) {
		this.logs.push({ type: "json", message: JSON.stringify(data), data });
	}

	cancel(message: string) {
		this.logs.push({ type: "cancel", message });
	}

	fatal(message: string, error?: unknown) {
		this.logs.push({ type: "fatal", message, data: error });
	}

	finish(message: string, details?: Record<string, any>) {
		this.logs.push({ type: "finish", message, data: details });
	}
}
