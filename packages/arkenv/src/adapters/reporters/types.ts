import type { Refusal } from "@/shared/errors";
import type { CompletedEnvelope, ErroredEnvelope } from "@/shared/protocol";

/**
 * Defines a long-running progress indicator.
 */
export type Spinner = {
	start(message: string): void;
	stop(message: string): void;
	message(message: string): void;
};

/**
 * Defines the contract for CLI output mechanisms.
 */
export type Reporter = {
	info(message: string): void;
	warn(message: string): void;
	error(message: string): void;
	success(message: string): void;
	step(message: string): void;
	note(message: string, title?: string): void;
	log(message: string): void;
	spinner(): Spinner;
	json(data: unknown): void;
	cancel(message: string, commandId?: string): void;
	fatal(message: string, error?: unknown, commandId?: string): never;
	/**
	 * Reports a deliberate, machine-readable refusal (a tripped safety check).
	 *
	 * In JSON mode this emits a Prisma-compatible ErroredEnvelope payload to `stdout`.
	 */
	refuse(refusal: Refusal, commandId?: string): void;
	finish(
		message: string,
		details?: Record<string, unknown>,
		commandId?: string,
	): void;
	reportCompleted(envelope: CompletedEnvelope): void;
	reportErrored(envelope: ErroredEnvelope): void;
	flush(): Promise<void>;
};
