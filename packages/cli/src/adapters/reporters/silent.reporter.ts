import type { Reporter, Spinner } from "./types";

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
	log(message: string) {
		process.stdout.write(`${this.stripAnsi(message)}\n`);
	}

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

	cancel(_message: string) {
		process.exit(1);
	}

	fatal(_message: string, _error?: unknown) {
		process.exit(1);
	}

	finish(_message: string, _details?: Record<string, unknown>) {}
}
