import type { LoggerPort } from "../shared/ports/logger.port";
import {
	JsonReporter,
	type Reporter,
	SilentReporter,
	type Spinner,
	TextReporter,
} from "./reporters";

export type LoggerOptions = {
	isQuiet: boolean;
	isJson: boolean;
	isYes?: boolean;
};

export class Logger implements LoggerPort {
	private originalStdoutWrite = process.stdout.write;
	private reporter: Reporter;

	constructor(private options: LoggerOptions) {
		if (options.isJson) {
			this.reporter = new JsonReporter();
		} else if (options.isQuiet) {
			this.reporter = new SilentReporter();
		} else {
			this.reporter = new TextReporter();
		}
	}

	info(message: string) {
		this.reporter.info(message);
	}

	warn(message: string) {
		this.reporter.warn(message);
	}

	error(message: string) {
		this.reporter.error(message);
	}

	success(message: string) {
		this.reporter.success(message);
	}

	step(message: string) {
		this.reporter.step(message);
	}

	note(message: string, title?: string) {
		this.reporter.note(message, title);
	}

	log(message: string) {
		this.reporter.log(message);
	}

	spinner(): Spinner {
		return this.reporter.spinner();
	}

	json(data: unknown) {
		this.reporter.json(data);
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
		this.reporter.cancel(message);
	}

	fatal(message: string, error?: unknown) {
		this.reporter.fatal(message, error);
	}

	finish(message: string, details?: Record<string, any>) {
		this.reporter.finish(message, details);
	}
}
