import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as vite from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the arkenv module to capture calls
vi.mock("arkenv", () => ({
	__esModule: true,
	default: vi.fn(),
	createEnv: vi.fn(),
}));

import arkenvPlugin from "./index.js";

const fixturesDir = join(__dirname, "__fixtures__");

// Get the mocked functions
const { createEnv: mockCreateEnv } = (await vi.importMock("arkenv")) as {
	createEnv: ReturnType<typeof vi.fn>;
};

// Run fixture-based tests
for (const name of readdirSync(fixturesDir)) {
	const fixtureDir = join(fixturesDir, name);

	describe(`Fixture: ${name}`, () => {
		beforeEach(() => {
			// Clear environment variables and mock cleanup
			vi.unstubAllEnvs();
			mockCreateEnv.mockClear();
		});

		afterEach(() => {
			// Complete cleanup: restore environment and reset mocks
			vi.unstubAllEnvs();
			mockCreateEnv.mockReset();
		});

		it("should build successfully with the plugin", async () => {
			const config = await readTestConfig(fixtureDir);

			// Mock createEnv to return a valid object
			mockCreateEnv.mockReturnValue(config.envVars || {});

			// Set up environment variables from the fixture
			if (config.envVars) {
				for (const [key, value] of Object.entries(config.envVars)) {
					vi.stubEnv(key, value);
				}
			}

			await expect(
				vite.build({
					configFile: false,
					root: config.root,
					plugins: [arkenvPlugin(config.Env)],
					logLevel: "error",
					build: {
						lib: {
							entry: "index.ts",
							formats: ["es"],
						},
						rollupOptions: {
							external: ["arkenv"],
						},
					},
				}),
			).resolves.not.toThrow();

			// Verify that createEnv was called with the correct parameters
			expect(mockCreateEnv).toHaveBeenCalledWith(
				config.Env,
				expect.objectContaining(config.envVars || {}),
			);
		});
	});
}

// Unit tests for plugin functionality
describe("Plugin Unit Tests", () => {
	beforeEach(() => {
		vi.unstubAllEnvs();
		mockCreateEnv.mockClear();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		mockCreateEnv.mockReset();
	});

	it("should create a plugin function", () => {
		expect(typeof arkenvPlugin).toBe("function");
	});

	it("should return a Vite plugin object", () => {
		const pluginInstance = arkenvPlugin({ VITE_TEST: "string" });

		expect(pluginInstance).toHaveProperty("name", "@arkenv/vite-plugin");
		expect(pluginInstance).toHaveProperty("config");
	});

	it("should call createEnv during config hook", () => {
		// Mock createEnv to return a valid object
		mockCreateEnv.mockReturnValue({ VITE_TEST: "test" });

		const pluginInstance = arkenvPlugin({ VITE_TEST: "string" });

		// Mock the config hook with proper context
		if (pluginInstance.config && typeof pluginInstance.config === "function") {
			const mockContext = {
				meta: {
					framework: "vite",
					version: "1.0.0",
					rollupVersion: "4.0.0",
					viteVersion: "5.0.0",
				},
				error: vi.fn(),
				warn: vi.fn(),
				info: vi.fn(),
				debug: vi.fn(),
			} as any;
			pluginInstance.config.call(
				mockContext,
				{},
				{ mode: "test", command: "build" },
			);
		}

		expect(mockCreateEnv).toHaveBeenCalledWith(
			{ VITE_TEST: "string" },
			expect.any(Object),
		);
	});

	it("should return define object with transformed environment variables", () => {
		// Mock createEnv to return transformed values
		const mockTransformedEnv = {
			VITE_STRING: "hello",
			VITE_NUMBER: 42,
			VITE_BOOLEAN: true,
		};
		mockCreateEnv.mockReturnValue(mockTransformedEnv);

		const pluginInstance = arkenvPlugin({
			VITE_STRING: "string",
			VITE_NUMBER: "number",
			VITE_BOOLEAN: "boolean",
		});

		// Call the config hook
		let result: any = {};
		if (pluginInstance.config && typeof pluginInstance.config === "function") {
			const mockContext = {
				meta: {
					framework: "vite",
					version: "1.0.0",
					rollupVersion: "4.0.0",
					viteVersion: "5.0.0",
				},
				error: vi.fn(),
				warn: vi.fn(),
				info: vi.fn(),
				debug: vi.fn(),
			} as any;
			result = pluginInstance.config.call(
				mockContext,
				{},
				{ mode: "test", command: "build" },
			);
		}

		// Verify the define object is returned
		expect(result).toHaveProperty("define");
		expect(result.define).toBeDefined();

		// Verify all transformed values are properly serialized
		expect(result.define).toEqual({
			"import.meta.env.VITE_STRING": '"hello"',
			"import.meta.env.VITE_NUMBER": "42",
			"import.meta.env.VITE_BOOLEAN": "true",
		});
	});

	it("should handle different data types in define object", () => {
		const mockTransformedEnv = {
			VITE_NULL: null,
			VITE_UNDEFINED: undefined,
			VITE_EMPTY_STRING: "",
			VITE_ZERO: 0,
			VITE_FALSE: false,
		};
		mockCreateEnv.mockReturnValue(mockTransformedEnv);

		const pluginInstance = arkenvPlugin({
			VITE_NULL: "string",
			VITE_UNDEFINED: "string",
			VITE_EMPTY_STRING: "string",
			VITE_ZERO: "number",
			VITE_FALSE: "boolean",
		});

		let result: any = {};
		if (pluginInstance.config && typeof pluginInstance.config === "function") {
			const mockContext = {
				meta: {
					framework: "vite",
					version: "1.0.0",
					rollupVersion: "4.0.0",
					viteVersion: "5.0.0",
				},
				error: vi.fn(),
				warn: vi.fn(),
				info: vi.fn(),
				debug: vi.fn(),
			} as any;
			result = pluginInstance.config.call(
				mockContext,
				{},
				{ mode: "test", command: "build" },
			);
		}

		expect(result.define).toEqual({
			"import.meta.env.VITE_NULL": "null",
			"import.meta.env.VITE_UNDEFINED": undefined, // JSON.stringify(undefined) returns undefined
			"import.meta.env.VITE_EMPTY_STRING": '""',
			"import.meta.env.VITE_ZERO": "0",
			"import.meta.env.VITE_FALSE": "false",
		});
	});

	it("should handle empty environment object", () => {
		mockCreateEnv.mockReturnValue({});

		const pluginInstance = arkenvPlugin({});

		let result: any = {};
		if (pluginInstance.config && typeof pluginInstance.config === "function") {
			const mockContext = {
				meta: {
					framework: "vite",
					version: "1.0.0",
					rollupVersion: "4.0.0",
					viteVersion: "5.0.0",
				},
				error: vi.fn(),
				warn: vi.fn(),
				info: vi.fn(),
				debug: vi.fn(),
			} as any;
			result = pluginInstance.config.call(
				mockContext,
				{},
				{ mode: "test", command: "build" },
			);
		}

		expect(result.define).toEqual({});
	});

	it("should preserve key names exactly as provided", () => {
		const mockTransformedEnv = {
			VITE_SPECIAL_CHARS: "test",
			VITE_123_NUMERIC: "test",
			VITE_UPPERCASE: "test",
			vite_lowercase: "test",
		};
		mockCreateEnv.mockReturnValue(mockTransformedEnv);

		const pluginInstance = arkenvPlugin({
			VITE_SPECIAL_CHARS: "string",
			VITE_123_NUMERIC: "string",
			VITE_UPPERCASE: "string",
			vite_lowercase: "string",
		});

		let result: any = {};
		if (pluginInstance.config && typeof pluginInstance.config === "function") {
			const mockContext = {
				meta: {
					framework: "vite",
					version: "1.0.0",
					rollupVersion: "4.0.0",
					viteVersion: "5.0.0",
				},
				error: vi.fn(),
				warn: vi.fn(),
				info: vi.fn(),
				debug: vi.fn(),
			} as any;
			result = pluginInstance.config.call(
				mockContext,
				{},
				{ mode: "test", command: "build" },
			);
		}

		expect(result.define).toEqual({
			"import.meta.env.VITE_SPECIAL_CHARS": '"test"',
			"import.meta.env.VITE_123_NUMERIC": '"test"',
			"import.meta.env.VITE_UPPERCASE": '"test"',
			"import.meta.env.vite_lowercase": '"test"',
		});
	});

	it("should propagate errors from createEnv", () => {
		const error = new Error("Environment validation failed");
		mockCreateEnv.mockImplementation(() => {
			throw error;
		});

		const pluginInstance = arkenvPlugin({ VITE_TEST: "string" });

		expect(() => {
			if (
				pluginInstance.config &&
				typeof pluginInstance.config === "function"
			) {
				const mockContext = {
					meta: {
						framework: "vite",
						version: "1.0.0",
						rollupVersion: "4.0.0",
						viteVersion: "5.0.0",
					},
					error: vi.fn(),
					warn: vi.fn(),
					info: vi.fn(),
					debug: vi.fn(),
				} as any;
				pluginInstance.config.call(
					mockContext,
					{},
					{ mode: "test", command: "build" },
				);
			}
		}).toThrow("Environment validation failed");
	});
});

async function readTestConfig(fixtureDir: string) {
	// Import the env schema from the TypeScript config file
	let Env: Record<string, string> = {};
	try {
		const configPath = join(fixtureDir, "config.ts");
		const configModule = await import(configPath);
		Env = configModule.Env;
	} catch {
		// config.ts file doesn't exist, that's fine
	}

	// Read environment variables from env.test file if it exists
	let envVars: Record<string, string> = {};
	try {
		const envContent = readFileSync(join(fixtureDir, "env.test"), "utf-8");
		envVars = Object.fromEntries(
			envContent
				.split("\n")
				.filter((line) => line.trim() && !line.startsWith("#"))
				.map((line) => {
					const [key, ...valueParts] = line.split("=");
					return [key.trim(), valueParts.join("=").trim()];
				}),
		);
	} catch {
		// env.test file doesn't exist, that's fine
	}

	return {
		root: fixtureDir,
		Env,
		envVars,
	};
}
