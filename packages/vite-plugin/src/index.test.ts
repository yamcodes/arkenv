import path from "node:path";
import { build } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the arkenv module to capture calls
const mockDefineEnv = vi.fn();
vi.mock("arkenv", () => ({
	defineEnv: mockDefineEnv,
}));

// Test data
const TEST_ENV_VARS = {
	VITE_TEST: "string",
	VITE_OPTIONAL: "string?",
	VITE_NUMBER: "number",
} as const;

const EXAMPLE_ROOT = path.resolve(
	__dirname,
	"../../../examples/with-vite-react-ts",
);

describe("@arkenv/vite-plugin", () => {
	beforeEach(() => {
		mockDefineEnv.mockClear();
	});

	afterEach(() => {
		// Clean up environment variables (but keep VITE_TEST for tests that need it)
		// VITE_TEST is loaded from .env.test file and should persist across tests
	});

	describe("Plugin Integration", () => {
		it("should call defineEnv with loaded environment variables", async () => {
			// Environment variable is loaded from .env.test file

			// Import the plugin
			const plugin = (await import("./index")).default;

			// Create a simple vite config with the plugin
			const config = {
				plugins: [
					plugin({
						VITE_TEST: "string",
					}),
				],
				root: EXAMPLE_ROOT,
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

		it("should work with multiple environment variables", async () => {
			const plugin = (await import("./index")).default;

			const config = {
				plugins: [plugin(TEST_ENV_VARS)],
				root: EXAMPLE_ROOT,
			};

			await build(config);

			expect(mockDefineEnv).toHaveBeenCalledWith(
				TEST_ENV_VARS,
				expect.objectContaining({
					VITE_TEST: "test-value",
				}),
			);
		});
	});

	describe("Error Handling", () => {
		it("should handle missing environment variables", async () => {
			// Temporarily remove VITE_TEST to test missing env var behavior
			const originalViteTest = process.env.VITE_TEST;
			delete process.env.VITE_TEST;

			// Store the original mock implementation
			const originalMockImplementation = mockDefineEnv.getMockImplementation();

			// Mock defineEnv to throw an error for this specific test
			mockDefineEnv.mockImplementation(() => {
				throw new Error("VITE_TEST must be a string (was missing)");
			});

			const plugin = (await import("./index")).default;

			const config = {
				plugins: [
					plugin({
						VITE_TEST: "string",
					}),
				],
				root: EXAMPLE_ROOT,
			};

			// This should throw because the required environment variable is missing
			// This is the correct behavior - the plugin should enforce required env vars
			await expect(build(config)).rejects.toThrow(
				"VITE_TEST must be a string (was missing)",
			);

			// Restore the original value and mock
			if (originalViteTest !== undefined) {
				process.env.VITE_TEST = originalViteTest;
			}
			// Restore the original mock implementation
			if (originalMockImplementation) {
				mockDefineEnv.mockImplementation(originalMockImplementation);
			} else {
				mockDefineEnv.mockReset();
			}
		});

		it("should handle invalid environment variable types", async () => {
			const originalMockImplementation = mockDefineEnv.getMockImplementation();

			mockDefineEnv.mockImplementation(() => {
				throw new Error("VITE_NUMBER must be a number (was string)");
			});

			const plugin = (await import("./index")).default;

			const config = {
				plugins: [
					plugin({
						VITE_NUMBER: "number",
					}),
				],
				root: EXAMPLE_ROOT,
			};

			await expect(build(config)).rejects.toThrow(
				"VITE_NUMBER must be a number (was string)",
			);

			// Restore the original mock implementation
			if (originalMockImplementation) {
				mockDefineEnv.mockImplementation(originalMockImplementation);
			} else {
				mockDefineEnv.mockReset();
			}
		});
	});

	describe("Integration Tests", () => {
		it("should work with the actual example project", async () => {
			// Environment variable is loaded from .env.test file

			const plugin = (await import("./index")).default;

			// Use the actual vite config from the example
			const config = {
				plugins: [
					plugin({
						VITE_TEST: "string",
					}),
				],
				root: EXAMPLE_ROOT,
				build: {
					outDir: "dist-test",
					write: false,
				},
			};

			// Build the example project
			const result = await build(config);

			// Verify the build succeeded
			expect(result).toBeDefined();

			// Vite build returns a RollupOutput object when write: false
			// Use type guard to ensure we have the correct type
			if (result && typeof result === "object" && "output" in result) {
				expect(Array.isArray(result.output)).toBe(true);
				expect(result.output.length).toBeGreaterThan(0);
			} else {
				throw new Error("Expected RollupOutput object with output property");
			}

			// Verify that defineEnv was called
			expect(mockDefineEnv).toHaveBeenCalledWith(
				{ VITE_TEST: "string" },
				expect.objectContaining({
					VITE_TEST: "test-value",
				}),
			);
		});

		it("should handle complex Vite configurations", async () => {
			const plugin = (await import("./index")).default;

			const config = {
				plugins: [plugin(TEST_ENV_VARS)],
				root: EXAMPLE_ROOT,
				build: {
					outDir: "dist-complex-test",
					write: false,
					minify: "terser" as const,
					sourcemap: true,
				},
				mode: "production" as const,
			};

			const result = await build(config);

			expect(result).toBeDefined();
			expect(mockDefineEnv).toHaveBeenCalledWith(
				TEST_ENV_VARS,
				expect.objectContaining({
					VITE_TEST: "test-value",
				}),
			);
		});
	});
});
