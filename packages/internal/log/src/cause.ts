/**
 * Format an unknown thrown value for secondary error output.
 *
 * Prefers the stack trace when the value is an {@link Error}.
 */
export function formatErrorCause(cause: unknown): string {
	if (cause instanceof Error) {
		return cause.stack ?? cause.message;
	}

	return String(cause);
}

/**
 * Route an error header and full cause through a single-message logger.
 */
export function logErrorWithCauseVia(
	log: (message: string) => void,
	header: string,
	cause: unknown,
): void {
	const message = cause instanceof Error ? cause.message : String(cause);
	log(`${header}: ${message}`);

	if (cause instanceof Error && cause.stack) {
		log(cause.stack);
	}
}
