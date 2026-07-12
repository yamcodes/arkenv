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
 * Resolve build log helpers from optional integration logging options.
 */
export function resolveBuildLog(options?: ArkEnvLogOptions): BuildLogHelpers {
	if (options?.logger) {
		return createBuildLogHelpers(options.logger);
	}

	if (options?.logLevel) {
		return createBuildLogHelpers(
			createConsoleLogger({ level: options.logLevel }),
		);
	}

	return createBuildLogHelpers(resolveLogger());
}
