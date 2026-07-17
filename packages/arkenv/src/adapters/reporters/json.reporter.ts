import pc from "picocolors";
import { ERROR_CODES, type Refusal } from "@/shared/errors";
import type { Reporter, Spinner } from "./types";

/**
 * Reporter implementation that outputs structured JSON logs.
 * Useful for machine-readable output or agent modes.
 */
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
			status: "cancelled",
			message,
		});
	}

	fatal(message: string, error?: unknown): never {
		const errorText =
			error instanceof Error
				? error.message
				: error
					? String(error)
					: undefined;
		this.json({
			status: "error",
			code: ERROR_CODES.INTERNAL,
			message,
			retryWith: [],
			...(errorText !== undefined ? { details: { error: errorText } } : {}),
		});
		throw error instanceof Error ? error : new Error(message);
	}

	refuse(refusal: Refusal) {
		this.json({
			status: "error",
			code: refusal.code,
			message: refusal.message,
			retryWith: refusal.retryWith,
			...(refusal.details !== undefined ? { details: refusal.details } : {}),
		});
	}

	finish(message: string, details?: Record<string, unknown>) {
		this.json({
			status: "success",
			message,
			details,
		});
	}

	async flush(): Promise<void> {
		return new Promise((resolve) => {
			process.stdout.write("", () => resolve());
		});
	}
}
