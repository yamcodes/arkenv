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

/** Plugin config with optional logging fields alongside ArkEnv options. */
export type ArkEnvPluginConfig<T extends Record<string, unknown>> = T &
	ArkEnvLogOptions;

/**
 * Split combined plugin config into ArkEnv options and logging options.
 */
export function splitPluginConfig<T extends Record<string, unknown>>(
	config?: (T & ArkEnvLogOptions) | undefined,
): { pluginConfig: T; logOptions: ArkEnvLogOptions } {
	if (!config) {
		return { pluginConfig: {} as T, logOptions: {} };
	}

	const { logger, logLevel, ...pluginConfig } = config;
	const logOptions: ArkEnvLogOptions = {};
	if (logger !== undefined) {
		logOptions.logger = logger;
	}
	if (logLevel !== undefined) {
		logOptions.logLevel = logLevel;
	}
	return {
		pluginConfig: pluginConfig as T,
		logOptions,
	};
}

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
