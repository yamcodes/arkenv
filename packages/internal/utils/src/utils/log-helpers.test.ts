import { afterEach, describe, expect, it, vi } from "vitest";
import {
	BUILD_PREFIX,
	formatBuildError,
	logBuildError,
	logBuildErrorBlankLine,
	logBuildErrorDetail,
	logBuildWarning,
	logWatcherError,
	WATCHER_PREFIX,
} from "./log-helpers";

describe("log helpers", () => {
	afterEach(() => {
		vi.restoreAllMocks();
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
});
