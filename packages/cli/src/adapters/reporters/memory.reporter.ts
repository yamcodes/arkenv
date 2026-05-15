import type { Reporter, Spinner } from "./types";

export class MemoryReporter implements Reporter {
	public logs: { type: string; message: string; data?: unknown }[] = [];

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

	finish(message: string, details?: Record<string, unknown>) {
		this.logs.push({ type: "finish", message, data: details });
	}
}
