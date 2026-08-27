import type { Refusal } from "@/shared/errors";
import type { CompletedEnvelope, ErroredEnvelope } from "@/shared/protocol";
import type { Reporter, Spinner } from "./types";

/**
 * Reporter implementation that stores logs in memory.
 * Useful for testing and assertion.
 */
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

	cancel(message: string, commandId?: string) {
		this.logs.push({ type: "cancel", message, data: { commandId } });
	}

	fatal(message: string, error?: unknown, commandId?: string): never {
		this.logs.push({ type: "fatal", message, data: { error, commandId } });
		throw error instanceof Error ? error : new Error(message);
	}

	refuse(refusal: Refusal, commandId?: string) {
		this.logs.push({
			type: "refuse",
			message: refusal.message,
			data: { ...refusal, commandId },
		});
	}

	finish(
		message: string,
		details?: Record<string, unknown>,
		commandId?: string,
	) {
		this.logs.push({
			type: "finish",
			message,
			data: { details, commandId },
		});
	}

	reportCompleted(envelope: CompletedEnvelope) {
		this.logs.push({
			type: "reportCompleted",
			message: `Completed ${envelope.commandId} with exitCode ${envelope.exitCode}`,
			data: envelope,
		});
	}

	reportErrored(envelope: ErroredEnvelope) {
		this.logs.push({
			type: "reportErrored",
			message: `Errored ${envelope.commandId}: ${envelope.error.summary}`,
			data: envelope,
		});
	}

	async flush(): Promise<void> {}
}
