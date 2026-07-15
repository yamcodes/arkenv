import { configureDefaultLogger } from "@repo/log";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	BUILD_PREFIX,
	formatBuildError,
	formatErrorCause,
	logBuildError,
	logBuildErrorBlankLine,
	logBuildErrorDetail,
	logBuildErrorWithCause,
	logBuildWarning,
	logErrorWithCauseVia,
	logWatcherError,
	logWatcherErrorWithCause,
	WATCHER_PREFIX,
} from "./log-helpers";

describe("log helpers", () => {
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
});
