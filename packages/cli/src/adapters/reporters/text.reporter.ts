import { spinner as clackSpinner, note, outro } from "@clack/prompts";
import pc from "picocolors";
import type { Refusal } from "@/shared/errors";
import type { Reporter, Spinner } from "./types";

/**
 * Reporter implementation that outputs styled text to the console.
 * The default reporter for human interaction.
 */
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
		process.stderr.write(`${pc.red(`✘ ${message}`)}\n`);
	}

	fatal(message: string, error?: unknown): never {
		process.stderr.write(`${pc.red(`✘ ${message}`)}\n`);
		if (error) {
			const detail = `${pc.red(error instanceof Error ? (error.stack ?? String(error)) : String(error))}\n`;
			process.stderr.write(detail);
		}
		throw error instanceof Error ? error : new Error(message);
	}

	refuse(_refusal: Refusal) {
		// Human-oriented refusal guidance is emitted via error()/info();
		// the structured payload is reserved for JSON output.
	}

	finish(message: string, _details?: Record<string, unknown>) {
		outro(message);
	}

	async flush(): Promise<void> {
		return new Promise((resolve) => {
			process.stderr.write("", () => resolve());
		});
	}
}
