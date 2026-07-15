import { formatErrorCause, logErrorWithCauseVia } from "./cause";
import { defaultLogger } from "./state";
import type { Logger } from "./types";

/** Standard prefix for ArkEnv build-time log messages. */
export const BUILD_PREFIX = "[ArkEnv]";

/** Standard prefix for ArkEnv file-watcher log messages. */
export const WATCHER_PREFIX = "[ArkEnv Watcher]";

/**
 * Format an error message with the standard build prefix.
 */
export function formatBuildError(message: string): string {
	return `${BUILD_PREFIX} ${message}`;
}

export type BuildLogHelpers = {
	logBuildWarning: (message: string) => void;
	logBuildError: (message: string) => void;
	logBuildErrorDetail: (message: string) => void;
	logBuildErrorBlankLine: () => void;
	logBuildErrorWithCause: (header: string, cause: unknown) => void;
	logWatcherError: (message: string) => void;
	logWatcherErrorWithCause: (header: string, cause: unknown) => void;
};

/**
 * Create build and watcher log helpers backed by an injectable logger.
 */
export function createBuildLogHelpers(logger: Logger): BuildLogHelpers {
	return {
		logBuildWarning(message: string) {
			logger.warn(`⚠️ ${BUILD_PREFIX} ${message}`);
		},
		logBuildError(message: string) {
			logger.error(`❌ ${BUILD_PREFIX} ${message}`);
		},
		logBuildErrorDetail(message: string) {
			logger.error(message);
		},
		logBuildErrorBlankLine() {
			logger.error("");
		},
		logBuildErrorWithCause(header: string, cause: unknown) {
			logger.error(`❌ ${BUILD_PREFIX} ${header}`);
			logger.error(formatErrorCause(cause));
		},
		logWatcherError(message: string) {
			logger.error(`${WATCHER_PREFIX} ${message}`);
		},
		logWatcherErrorWithCause(header: string, cause: unknown) {
			logger.error(`${WATCHER_PREFIX} ${header}`);
			logger.error(formatErrorCause(cause));
		},
	};
}

/**
 * Resolve a logger for build integrations, falling back to the default instance.
 */
export function resolveLogger(logger?: Logger): Logger {
	return logger ?? defaultLogger;
}

export { logErrorWithCauseVia };

let activeBuildLog = createBuildLogHelpers(defaultLogger);

/**
 * Rebind static build log helpers to a new logger instance.
 */
export function bindDefaultBuildLog(logger: Logger): void {
	activeBuildLog = createBuildLogHelpers(logger);
}

/** Log a warning message with the warning symbol and build prefix. */
export function logBuildWarning(message: string): void {
	activeBuildLog.logBuildWarning(message);
}

/** Log an error message with the error symbol and build prefix. */
export function logBuildError(message: string): void {
	activeBuildLog.logBuildError(message);
}

/** Log a secondary error detail line without the build prefix. */
export function logBuildErrorDetail(message: string): void {
	activeBuildLog.logBuildErrorDetail(message);
}

/** Log a blank line after build error output for visual separation. */
export function logBuildErrorBlankLine(): void {
	activeBuildLog.logBuildErrorBlankLine();
}

/** Log a build error header plus the full cause (stack or string). */
export function logBuildErrorWithCause(header: string, cause: unknown): void {
	activeBuildLog.logBuildErrorWithCause(header, cause);
}

/** Log an error message for the file watcher. */
export function logWatcherError(message: string): void {
	activeBuildLog.logWatcherError(message);
}

/** Log a watcher error header plus the full cause (stack or string). */
export function logWatcherErrorWithCause(header: string, cause: unknown): void {
	activeBuildLog.logWatcherErrorWithCause(header, cause);
}
