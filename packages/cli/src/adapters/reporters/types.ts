import type { Refusal } from "@/shared/errors";

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
	cancel(message: string): void;
	fatal(message: string, error?: unknown): never;
	/**
	 * Reports a deliberate, machine-readable refusal (a tripped safety check).
	 *
	 * In JSON mode this emits a structured `status: "error"` payload carrying the
	 * refusal's stable `code` and `retryWith` hint to `stdout`; human-oriented
	 * reporters treat it as a no-op since the equivalent guidance is already
	 * surfaced via {@link Reporter.error}/{@link Reporter.info}.
	 */
	refuse(refusal: Refusal): void;
	finish(message: string, details?: Record<string, unknown>): void;
	flush(): Promise<void>;
};
