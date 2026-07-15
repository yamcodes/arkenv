import { bindDefaultBuildLog } from "./build-log";
import { createConsoleLogger } from "./console-logger";
import { defaultLogger, setDefaultLogger } from "./state";
import type { Logger, LoggerConfig } from "./types";

export { defaultLogger };

/**
 * Replace the default logger and optional level configuration.
 *
 * @param config Programmatic logger configuration
 * @param logger Optional custom logger instance (overrides console logger creation)
 */
export function configureDefaultLogger(
	config?: LoggerConfig,
	logger?: Logger,
): void {
	const nextLogger = logger ?? createConsoleLogger(config);
	setDefaultLogger(nextLogger);
	bindDefaultBuildLog(nextLogger);
}
