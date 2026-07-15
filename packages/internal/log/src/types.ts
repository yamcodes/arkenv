/** Supported log level thresholds, from most to least verbose. */
export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

/**
 * Shared logger interface for ArkEnv packages.
 *
 * CLI-specific features (spinners, JSON reporters, `flush`) stay outside this type.
 */
export type Logger = {
	debug: (message: string, ...optionalParams: unknown[]) => void;
	info: (message: string, ...optionalParams: unknown[]) => void;
	warn: (message: string, ...optionalParams: unknown[]) => void;
	error: (message: string, ...optionalParams: unknown[]) => void;
};

/** Programmatic logger configuration. Takes precedence over `ARKENV_LOG_LEVEL`. */
export type LoggerConfig = {
	level?: LogLevel;
};
