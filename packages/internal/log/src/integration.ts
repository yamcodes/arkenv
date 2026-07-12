import {
	type BuildLogHelpers,
	createBuildLogHelpers,
	resolveLogger,
} from "./build-log";
import { createConsoleLogger } from "./console-logger";
import type { Logger, LogLevel } from "./types";

/** Logging options accepted by ArkEnv build integrations. */
export type ArkEnvLogOptions = {
	logger?: Logger;
	logLevel?: LogLevel;
};

/**
 * Resolve a logger from optional integration logging options.
 */
export function resolveLoggerFromOptions(options?: ArkEnvLogOptions): Logger {
	if (options?.logger) {
		return options.logger;
	}

	if (options?.logLevel) {
		return createConsoleLogger({ level: options.logLevel });
	}

	return resolveLogger();
}

/**
 * Resolve build log helpers from optional integration logging options.
 */
export function resolveBuildLog(options?: ArkEnvLogOptions): BuildLogHelpers {
	return createBuildLogHelpers(resolveLoggerFromOptions(options));
}
