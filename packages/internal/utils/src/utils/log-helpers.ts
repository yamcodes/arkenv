/** Standard prefix for ArkEnv build-time log messages. */
export const BUILD_PREFIX = "[ArkEnv]";

/** Standard prefix for ArkEnv file-watcher log messages. */
export const WATCHER_PREFIX = "[ArkEnv Watcher]";

/**
 * Format an error message with the standard build prefix.
 *
 * @param message The error message to format
 * @returns The message prefixed with `[ArkEnv]`
 */
export function formatBuildError(message: string): string {
	return `${BUILD_PREFIX} ${message}`;
}

/**
 * Log a warning message with the warning symbol and build prefix.
 *
 * @param message The warning message to log
 */
export function logBuildWarning(message: string): void {
	console.warn(`⚠️ ${BUILD_PREFIX} ${message}`);
}

/**
 * Log an error message with the error symbol and build prefix.
 *
 * @param message The error message to log
 */
export function logBuildError(message: string): void {
	console.error(`❌ ${BUILD_PREFIX} ${message}`);
}

/**
 * Log a secondary error detail line without the build prefix.
 *
 * Use after {@link logBuildError} when the error body should appear on its own line.
 *
 * @param message The detail message to log
 */
export function logBuildErrorDetail(message: string): void {
	console.error(message);
}

/**
 * Log a blank line after build error output for visual separation.
 */
export function logBuildErrorBlankLine(): void {
	console.error("");
}

/**
 * Log an error message for the file watcher.
 *
 * @param message The watcher error message to log
 */
export function logWatcherError(message: string): void {
	console.error(`${WATCHER_PREFIX} ${message}`);
}
