import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the arkenv module with a spy that calls the real implementation by default
vi.mock("@arkenv/core", async (importActual) => {
	const actual = await importActual<typeof import("@arkenv/core")>();
	return {
		...actual,
		arkenv: vi.fn(actual.arkenv),
	};
});

import { arkenv } from "./plugin";

const { arkenv: mockArkenv } = vi.mocked(await import("@arkenv/core"));

describe("Bun Plugin", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
		mockArkenv.mockClear();
	});

	afterEach(() => {
		process.env = originalEnv;
		mockArkenv.mockClear();
	});

	it("should create a plugin function", () => {
		expect(typeof arkenv).toBe("function");
	});

	it("should return a Bun plugin object", () => {
		// Set up a valid environment variable
		process.env.BUN_PUBLIC_TEST = "test-value";

		const pluginInstance = arkenv({ BUN_PUBLIC_TEST: "string" });

		expect(pluginInstance).toHaveProperty("name", "@arkenv/bun-plugin");
		expect(pluginInstance).toHaveProperty("setup");
		expect(typeof pluginInstance.setup).toBe("function");
	});

	it("should validate environment variables at plugin creation", () => {
		// Set up a valid environment variable
		process.env.BUN_PUBLIC_TEST = "test-value";

		expect(() => {
			arkenv({ BUN_PUBLIC_TEST: "string" });
		}).not.toThrow();
	});

	it("should throw if environment variable validation fails", () => {
		// Don't set the required environment variable
		delete process.env.BUN_PUBLIC_REQUIRED;

		expect(() => {
			arkenv({ BUN_PUBLIC_REQUIRED: "string" });
		}).toThrow();
	});

	it("should pass arkenvConfig to arkenv", () => {
		process.env.BUN_PUBLIC_TEST = "test-value";

		arkenv({ BUN_PUBLIC_TEST: "string" }, { coerce: false });

		expect(mockArkenv).toHaveBeenCalledWith(
			{ BUN_PUBLIC_TEST: "string" },
			expect.objectContaining({
				coerce: false,
				env: expect.any(Object),
			}),
		);
	});

	it("should respect logLevel when validation fails", () => {
		delete process.env.BUN_PUBLIC_REQUIRED;
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => {
			arkenv({ BUN_PUBLIC_REQUIRED: "string" }, { logLevel: "silent" });
		}).toThrow();

		expect(errorSpy).not.toHaveBeenCalled();
		errorSpy.mockRestore();
	});
});
