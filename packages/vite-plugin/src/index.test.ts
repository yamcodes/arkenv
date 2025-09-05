import path from "node:path";
import { build } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the arkenv module to capture calls
const mockDefineEnv = vi.fn();
vi.mock("arkenv", () => ({
	defineEnv: mockDefineEnv,
}));

describe("@arkenv/vite-plugin", () => {
	beforeEach(() => {
		mockDefineEnv.mockClear();
	});

	afterEach(() => {
		// Clean up environment variables
		delete process.env.VITE_TEST;
	});

	it("should call defineEnv with loaded environment variables", async () => {
		// Set up environment variable
		process.env.VITE_TEST = "test-value";

		// Import the plugin
		const plugin = (await import("./index.js")).default;

		// Create a simple vite config with the plugin
		const config = {
			plugins: [
				plugin({
					VITE_TEST: "string",
				}),
			],
			root: path.resolve(__dirname, "../../../examples/with-vite-react-ts"),
		};

		// Build the project to trigger the plugin
		await build(config);

		// Verify that defineEnv was called with the correct environment variables
		expect(mockDefineEnv).toHaveBeenCalledWith(
			{ VITE_TEST: "string" },
			expect.objectContaining({
				VITE_TEST: "test-value",
			}),
		);
	});

	it("should handle missing environment variables", async () => {
		// Don't set VITE_TEST environment variable

		const plugin = (await import("./index.js")).default;

		const config = {
			plugins: [
				plugin({
					VITE_TEST: "string",
				}),
			],
			root: path.resolve(__dirname, "../../../examples/with-vite-react-ts"),
		};

		// This should throw because the required environment variable is missing
		// This is the correct behavior - the plugin should enforce required env vars
		await expect(build(config)).rejects.toThrow(
			"VITE_TEST must be a string (was missing)",
		);
	});

	it("should work with the actual example project", async () => {
		// Set the required environment variable
		process.env.VITE_TEST = "integration-test-value";

		const plugin = (await import("./index.js")).default;

		// Use the actual vite config from the example
		const config = {
			plugins: [
				plugin({
					VITE_TEST: "string",
				}),
			],
			root: path.resolve(__dirname, "../../../examples/with-vite-react-ts"),
			build: {
				outDir: "dist-test",
			},
		};

		// Build the example project
		const result = await build(config);

		// Verify the build succeeded
		expect(result).toBeDefined();
		// Vite build returns a build result object
		expect(result).toHaveProperty("output");
		expect(Array.isArray(result.output)).toBe(true);
		expect(result.output.length).toBeGreaterThan(0);

		// Verify that defineEnv was called
		expect(mockDefineEnv).toHaveBeenCalledWith(
			{ VITE_TEST: "string" },
			expect.objectContaining({
				VITE_TEST: "integration-test-value",
			}),
		);
	});
});
