import { resolveLogLevel, shouldLog } from "./levels";
import type { Logger, LoggerConfig, LogLevel } from "./types";

type LogMethod = (message: string, ...optionalParams: unknown[]) => void;

function createLogMethod(
	configuredLevel: LogLevel,
	messageLevel: Exclude<LogLevel, "silent">,
	consoleMethod: "debug" | "info" | "warn" | "error",
): LogMethod {
	return (message: string, ...optionalParams: unknown[]) => {
		if (!shouldLog(configuredLevel, messageLevel)) return;
		console[consoleMethod](message, ...optionalParams);
	};
}

/**
 * Create a console-backed logger with level-threshold filtering.
 *
 * @param config Optional programmatic configuration (overrides `ARKENV_LOG_LEVEL`)
 */
export function createConsoleLogger(config?: LoggerConfig): Logger {
	const level = resolveLogLevel(config);

	return {
		debug: createLogMethod(level, "debug", "debug"),
		info: createLogMethod(level, "info", "info"),
		warn: createLogMethod(level, "warn", "warn"),
		error: createLogMethod(level, "error", "error"),
	};
}
