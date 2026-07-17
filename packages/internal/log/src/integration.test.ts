import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureDefaultLogger } from "./default-logger";
import { resolveBuildLog, resolveLoggerFromOptions } from "./integration";

describe("integration logging", () => {
	beforeEach(() => {
		configureDefaultLogger({ level: "info" });
	});

	afterEach(() => {
		vi.restoreAllMocks();
		configureDefaultLogger({ level: "info" });
	});

	it("resolveBuildLog routes warnings through a custom logger", () => {
		const logger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		};
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		resolveBuildLog({ logger }).logBuildWarning("custom");

		expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("custom"));
		expect(warn).not.toHaveBeenCalled();
	});

	it("resolveBuildLog respects silent logLevel", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		resolveBuildLog({ logLevel: "silent" }).logBuildWarning("hidden");

		expect(warn).not.toHaveBeenCalled();
	});

	it("resolveLoggerFromOptions creates a level-filtered logger", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});

		resolveLoggerFromOptions({ logLevel: "silent" }).error("hidden");

		expect(error).not.toHaveBeenCalled();
	});
});
