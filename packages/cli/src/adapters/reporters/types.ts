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
	fatal(message: string, error?: unknown): void;
	finish(message: string, details?: Record<string, unknown>): void;
	flush(): Promise<void>;
};
