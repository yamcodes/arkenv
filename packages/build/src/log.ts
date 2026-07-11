export const BUILD_PREFIX = "[ArkEnv]";
export const WATCHER_PREFIX = "[ArkEnv Watcher]";

/**
 * Format an error message with the standard build prefix.
 */
export function formatBuildError(message: string): string {
	return `${BUILD_PREFIX} ${message}`;
}

/**
 * Log a warning message with the warning symbol and build prefix.
 */
export function logBuildWarning(message: string): void {
	console.warn(`⚠️ ${BUILD_PREFIX} ${message}`);
}

/**
 * Log an error message with the error symbol and build prefix.
 */
export function logBuildError(message: string): void {
	console.error(`❌ ${BUILD_PREFIX} ${message}`);
}

/**
 * Log an error message for the watcher.
 */
export function logWatcherError(message: string): void {
	console.error(`${WATCHER_PREFIX} ${message}`);
}
