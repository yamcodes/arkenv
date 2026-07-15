import type { LoggerConfig, LogLevel } from "./types";

const LEVEL_RANK: Record<Exclude<LogLevel, "silent">, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

const VALID_LEVELS = new Set<LogLevel>([
	"debug",
	"info",
	"warn",
	"error",
	"silent",
]);

/**
 * Parse a log level string from configuration or environment.
 *
 * @param value Raw level string (e.g. from `ARKENV_LOG_LEVEL`)
 * @returns Parsed level, or `undefined` when the value is missing or invalid
 */
export function parseLogLevel(value: string | undefined): LogLevel | undefined {
	if (!value) return undefined;

	const normalized = value.trim().toLowerCase();
	if (VALID_LEVELS.has(normalized as LogLevel)) {
		return normalized as LogLevel;
	}

	return undefined;
}

/**
 * Read `ARKENV_LOG_LEVEL` in a browser-safe way.
 */
export function readEnvLogLevel(): LogLevel | undefined {
	if (typeof process === "undefined") return undefined;
	return parseLogLevel(process.env?.ARKENV_LOG_LEVEL);
}

/**
 * Resolve the effective log level from programmatic config and environment.
 *
 * Programmatic `config.level` wins over `ARKENV_LOG_LEVEL`. Defaults to `info`.
 */
export function resolveLogLevel(config?: LoggerConfig): LogLevel {
	return config?.level ?? readEnvLogLevel() ?? "info";
}

/**
 * Whether a message at `messageLevel` should be emitted for `configuredLevel`.
 */
export function shouldLog(
	configuredLevel: LogLevel,
	messageLevel: Exclude<LogLevel, "silent">,
): boolean {
	if (configuredLevel === "silent") return false;
	return LEVEL_RANK[messageLevel] >= LEVEL_RANK[configuredLevel];
}
