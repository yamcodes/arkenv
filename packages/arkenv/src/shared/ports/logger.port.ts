import type { Refusal } from "@/shared/errors";

/**
 * Represents a CLI spinner for long-running tasks.
 */
export type Spinner = {
	start(message: string): void;
	stop(message: string): void;
	message(message: string): void;
};

/**
 * Port interface for CLI logging operations.
 */
export type LoggerPort = {
	debug(message: string): void;
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
	 * Emits structured JSON in `--json`/`--agent` mode; a no-op for human output.
	 */
	refuse(refusal: Refusal): void;
	finish(message: string, details?: Record<string, unknown>): void;
	flush(): Promise<void>;
	interactiveStdout(enable: boolean): void;
	readonly stdio:
		| "inherit"
		| "ignore"
		| "pipe"
		| readonly (object | number | string | null | undefined)[];
};
