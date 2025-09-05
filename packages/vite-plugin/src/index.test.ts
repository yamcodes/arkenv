import path from "node:path";
import { build, type InlineConfig } from "vite";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

// Helper function to build with our plugin
async function buildWithPlugin(
	envVars: Record<string, string>,
	options: InlineConfig = {},
) {
	const plugin = (await import("./index")).default;

	return build({
		plugins: [plugin(envVars)],
		root: EXAMPLE_ROOT,
		...options,
	});
}

describe("@arkenv/vite-plugin", () => {
	beforeEach(() => {
		mockDefineEnv.mockClear();
	});

	describe("Plugin Integration", () => {
		it("should call defineEnv with loaded environment variables", async () => {
			// Environment variable is loaded from .env.test file
			await buildWithPlugin({ VITE_TEST: "string" });

			// Verify that defineEnv was called with the correct environment variables
			expect(mockDefineEnv).toHaveBeenCalledWith(
				{ VITE_TEST: "string" },
				expect.objectContaining({
					VITE_TEST: "test-value",
				}),
			);
		});

		it("should work with multiple environment variables", async () => {
			await buildWithPlugin(TEST_ENV_VARS);

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

			// This should throw because the required environment variable is missing
			await expect(buildWithPlugin({ VITE_TEST: "string" })).rejects.toThrow(
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

			await expect(buildWithPlugin({ VITE_NUMBER: "number" })).rejects.toThrow(
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

			// Verify that defineEnv was called
			expect(mockDefineEnv).toHaveBeenCalledWith(
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
			expect(mockDefineEnv).toHaveBeenCalledWith(
				TEST_ENV_VARS,
				expect.objectContaining({
					VITE_TEST: "test-value",
				}),
			);
		});
	});
});
