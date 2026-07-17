import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	BUILD_PREFIX,
	formatBuildError,
	logBuildError,
	logBuildErrorBlankLine,
	logBuildErrorDetail,
	logBuildErrorWithCause,
	logBuildWarning,
	logErrorWithCauseVia,
	logWatcherError,
	logWatcherErrorWithCause,
	WATCHER_PREFIX,
} from "./build-log";
import { formatErrorCause } from "./cause";
import { shouldDisableColors } from "./colors";
import { createConsoleLogger } from "./console-logger";
import { configureDefaultLogger } from "./default-logger";
import { parseLogLevel, resolveLogLevel, shouldLog } from "./levels";

describe("log levels", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		configureDefaultLogger({ level: "info" });
	});
	it("parseLogLevel accepts valid levels", () => {
		expect(parseLogLevel("DEBUG")).toBe("debug");
		expect(parseLogLevel(" silent ")).toBe("silent");
	});

	it("parseLogLevel rejects invalid values", () => {
		expect(parseLogLevel("verbose")).toBeUndefined();
	});

	it("resolveLogLevel prefers programmatic config", () => {
		vi.stubEnv("ARKENV_LOG_LEVEL", "error");
		expect(resolveLogLevel({ level: "debug" })).toBe("debug");
	});

	it("resolveLogLevel falls back to ARKENV_LOG_LEVEL", () => {
		vi.stubEnv("ARKENV_LOG_LEVEL", "warn");
		expect(resolveLogLevel()).toBe("warn");
	});

	it("shouldLog filters by threshold", () => {
		expect(shouldLog("warn", "info")).toBe(false);
		expect(shouldLog("warn", "warn")).toBe(true);
		expect(shouldLog("warn", "error")).toBe(true);
		expect(shouldLog("silent", "error")).toBe(false);
	});
});

describe("console logger", () => {
	beforeEach(() => {
		configureDefaultLogger({ level: "info" });
	});

	afterEach(() => {
		vi.restoreAllMocks();
		configureDefaultLogger({ level: "info" });
	});

	it("filters messages below the configured level", () => {
		const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const logger = createConsoleLogger({ level: "warn" });

		logger.debug("hidden");
		logger.warn("visible");

		expect(debug).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalledWith("visible");
	});

	it("suppresses all output in silent mode", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		const logger = createConsoleLogger({ level: "silent" });

		logger.error("hidden");

		expect(error).not.toHaveBeenCalled();
	});
});

describe("build log helpers", () => {
	beforeEach(() => {
		configureDefaultLogger({ level: "info" });
	});

	afterEach(() => {
		vi.restoreAllMocks();
		configureDefaultLogger({ level: "info" });
	});

	it("formatBuildError prefixes messages with BUILD_PREFIX", () => {
		expect(formatBuildError("Something failed")).toBe(
			`${BUILD_PREFIX} Something failed`,
		);
	});

	it("logBuildWarning writes to console.warn with prefix and symbol", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		logBuildWarning("deprecated option");
		expect(warn).toHaveBeenCalledWith(`⚠️ ${BUILD_PREFIX} deprecated option`);
	});

	it("logBuildError writes to console.error with prefix and symbol", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		logBuildError("validation failed");
		expect(error).toHaveBeenCalledWith(`❌ ${BUILD_PREFIX} validation failed`);
	});

	it("logBuildErrorDetail writes the message without prefix", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		logBuildErrorDetail("detail line");
		expect(error).toHaveBeenCalledWith("detail line");
	});

	it("logBuildErrorBlankLine writes an empty line", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		logBuildErrorBlankLine();
		expect(error).toHaveBeenCalledWith("");
	});

	it("logWatcherError writes to console.error with watcher prefix", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		logWatcherError("watch failed");
		expect(error).toHaveBeenCalledWith(`${WATCHER_PREFIX} watch failed`);
	});

	it("formatErrorCause prefers stack traces for Error values", () => {
		const err = new Error("boom");
		expect(formatErrorCause(err)).toBe(err.stack);
	});

	it("logBuildErrorWithCause writes header and full cause", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		const err = new Error("append failed");

		logBuildErrorWithCause("Failed to append", err);

		expect(error).toHaveBeenNthCalledWith(
			1,
			`❌ ${BUILD_PREFIX} Failed to append`,
		);
		expect(error).toHaveBeenNthCalledWith(2, err.stack);
	});

	it("logWatcherErrorWithCause writes header and full cause", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		const err = new Error("watch failed");

		logWatcherErrorWithCause("Failed to regenerate env", err);

		expect(error).toHaveBeenNthCalledWith(
			1,
			`${WATCHER_PREFIX} Failed to regenerate env`,
		);
		expect(error).toHaveBeenNthCalledWith(2, err.stack);
	});

	it("logErrorWithCauseVia routes header and stack through a logger", () => {
		const log = vi.fn();
		const err = new Error("watch failed");

		logErrorWithCauseVia(log, "Failed to watch", err);

		expect(log).toHaveBeenNthCalledWith(1, "Failed to watch: watch failed");
		expect(log).toHaveBeenNthCalledWith(2, err.stack);
	});

	it("respects silent mode for build warnings", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		configureDefaultLogger({ level: "silent" });
		logBuildWarning("hidden");
		expect(warn).not.toHaveBeenCalled();
	});
});

describe("colors", () => {
	it("disables colors when FORCE_COLOR is 0", () => {
		vi.stubEnv("FORCE_COLOR", "0");
		vi.stubEnv("NO_COLOR", undefined);
		vi.stubEnv("CI", undefined);
		expect(shouldDisableColors()).toBe(true);
	});

	it("disables colors in browser-like environments", () => {
		const originalProcess = globalThis.process;
		Object.defineProperty(globalThis, "process", {
			value: undefined,
			configurable: true,
		});
		expect(shouldDisableColors()).toBe(true);
		Object.defineProperty(globalThis, "process", {
			value: originalProcess,
			configurable: true,
		});
	});

	it("enables colors when FORCE_COLOR is set", () => {
		vi.stubEnv("FORCE_COLOR", "1");
		vi.stubEnv("NO_COLOR", undefined);
		vi.stubEnv("CI", undefined);
		expect(shouldDisableColors()).toBe(false);
	});
});
