import path from "node:path";
import react from "@vitejs/plugin-react";
import { build, type InlineConfig } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the arkenv module to capture calls
const mockCreateEnv = vi.fn();
vi.mock("arkenv", () => ({
	__esModule: true,
	default: mockCreateEnv,
	createEnv: mockCreateEnv,
}));

// Capture snapshot of process.env at module level
const ORIGINAL_ENV = { ...process.env };

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

// Helper function to build with our plugin
async function buildWithPlugin(
	envVars: Record<string, string>,
	options: InlineConfig = {},
) {
	const plugin = (await import("./index")).default;

	return build({
		plugins: [react(), plugin(envVars)],
		root: EXAMPLE_ROOT,
		configFile: false,
		...options,
	});
}

describe("@arkenv/vite-plugin", () => {
	beforeEach(() => {
		// Complete module isolation and clean environment start
		vi.resetModules();
		process.env = { ...ORIGINAL_ENV };
		mockCreateEnv.mockClear();
	});

	afterEach(() => {
		// Complete cleanup: restore environment and reset mocks
		process.env = { ...ORIGINAL_ENV };
		mockCreateEnv.mockReset();
	});

	describe("Plugin Integration", () => {
		it("should call createEnv with loaded environment variables", async () => {
			// Environment variable is loaded from .env.test file
			await buildWithPlugin({ VITE_TEST: "string" });

			// Verify that createEnv was called with the correct environment variables
			expect(mockCreateEnv).toHaveBeenCalledWith(
				{ VITE_TEST: "string" },
				expect.objectContaining({
					VITE_TEST: "test-value",
				}),
			);
		});

		it("should work with multiple environment variables", async () => {
			await buildWithPlugin(TEST_ENV_VARS);

			expect(mockCreateEnv).toHaveBeenCalledWith(
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
			delete process.env.VITE_TEST;

			// Store the original mock implementation
			const originalMockImplementation = mockCreateEnv.getMockImplementation();

			// Mock createEnv to throw an error for this specific test
			mockCreateEnv.mockImplementation(() => {
				throw new Error("VITE_TEST must be a string (was missing)");
			});

			// This should throw because the required environment variable is missing
			await expect(buildWithPlugin({ VITE_TEST: "string" })).rejects.toThrow(
				"VITE_TEST must be a string (was missing)",
			);

			// Restore the original mock implementation
			if (originalMockImplementation) {
				mockCreateEnv.mockImplementation(originalMockImplementation);
			} else {
				mockCreateEnv.mockReset();
			}
		});

		it("should handle invalid environment variable types", async () => {
			const originalMockImplementation = mockCreateEnv.getMockImplementation();

			mockCreateEnv.mockImplementation(() => {
				throw new Error("VITE_NUMBER must be a number (was string)");
			});

			await expect(buildWithPlugin({ VITE_NUMBER: "number" })).rejects.toThrow(
				"VITE_NUMBER must be a number (was string)",
			);

			// Restore the original mock implementation
			if (originalMockImplementation) {
				mockCreateEnv.mockImplementation(originalMockImplementation);
			} else {
				mockCreateEnv.mockReset();
			}
		});
	});

	describe("Integration Tests", () => {
		it("should work with the actual example project", async () => {
			// Environment variable is loaded from .env.test file
			const result = await buildWithPlugin(
				{ VITE_TEST: "string" },
				{
					build: {
						outDir: "dist-test",
						write: false,
					},
				},
			);

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

			// Verify that createEnv was called
			expect(mockCreateEnv).toHaveBeenCalledWith(
				{ VITE_TEST: "string" },
				expect.objectContaining({
					VITE_TEST: "test-value",
				}),
			);
		});

		it("should handle complex Vite configurations", async () => {
			const result = await buildWithPlugin(TEST_ENV_VARS, {
				build: {
					outDir: "dist-complex-test",
					write: false,
					minify: "terser",
					sourcemap: true,
				},
				mode: "production",
			});

			expect(result).toBeDefined();
			expect(mockCreateEnv).toHaveBeenCalledWith(
				TEST_ENV_VARS,
				expect.objectContaining({
					VITE_TEST: "test-value",
				}),
			);
		});
	});
});
