import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as vite from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the arkenv module to capture calls
// Mock the arkenv module with a spy that calls the real implementation by default
vi.mock("arkenv", async (importActual) => {
	const actual = await importActual<typeof import("arkenv")>();
	return {
		...actual,
		default: vi.fn(actual.default),
		createEnv: vi.fn(actual.createEnv),
	};
});

// Mock the vite module to capture loadEnv calls
vi.mock("vite", async (importActual) => {
	const actual = await importActual<typeof import("vite")>();
	return {
		...actual,
		loadEnv: vi.fn(actual.loadEnv),
	};
});

import arkenvPlugin from "./index.js";

const fixturesDir = join(__dirname, "__fixtures__");

// Get the mocked functions
const { createEnv: mockCreateEnv } = vi.mocked(await import("arkenv"));

const mockLoadEnv = vi.mocked(vite.loadEnv);

// Run fixture-based tests for standard fixtures
// (Specialized fixtures like 'with-env-dir' are handled by dedicated integration tests below)
for (const name of readdirSync(fixturesDir).filter(
	(n) => n !== "with-env-dir",
)) {
	const fixtureDir = join(fixturesDir, name);

	describe(`Fixture: ${name}`, () => {
		beforeEach(() => {
			// Clear environment variables and mock cleanup
			vi.unstubAllEnvs();
			mockCreateEnv.mockClear();
			mockLoadEnv.mockClear();
		});

		afterEach(() => {
			// Complete cleanup: restore environment and reset mocks
			vi.unstubAllEnvs();
			mockCreateEnv.mockReset();
			mockLoadEnv.mockReset();
		});

		it("should build successfully with the plugin", async () => {
			const config = await readTestConfig(fixtureDir);

			// We no longer mock createEnv return value here,
			// letting it run with real implementations.

			await expect(
				vite.build({
					mode: "test",
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
			expect(mockCreateEnv).toHaveBeenCalledWith(config.Env, {
				env: expect.objectContaining(config.envVars || {}),
			});
		});
	});
}

// Unit tests for plugin functionality
describe("Plugin Unit Tests", () => {
	beforeEach(() => {
		vi.unstubAllEnvs();
		mockCreateEnv.mockClear();
		mockLoadEnv.mockClear();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		mockCreateEnv.mockReset();
		mockLoadEnv.mockReset();
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
			{
				env: expect.any(Object),
			},
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

	it("should preserve key names exactly as provided for prefixed variables", () => {
		const mockTransformedEnv = {
			VITE_SPECIAL_CHARS: "test",
			VITE_123_NUMERIC: "test",
			VITE_UPPERCASE: "test",
			vite_lowercase: "test", // This doesn't start with VITE_ so it will be filtered out
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

		// Only variables starting with VITE_ are exposed
		expect(result.define).toEqual({
			"import.meta.env.VITE_SPECIAL_CHARS": '"test"',
			"import.meta.env.VITE_123_NUMERIC": '"test"',
			"import.meta.env.VITE_UPPERCASE": '"test"',
		});
		// Variables not starting with VITE_ are filtered out
		expect(result.define).not.toHaveProperty("import.meta.env.vite_lowercase");
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

	it("should filter out server-only variables (default VITE_ prefix)", () => {
		// Mock createEnv to return both server-only and client-safe variables
		const mockTransformedEnv = {
			PORT: 3000,
			DATABASE_URL: "postgres://localhost:5432/db",
			VITE_API_URL: "https://api.example.com",
			VITE_DEBUG: true,
		};
		mockCreateEnv.mockReturnValue(mockTransformedEnv);

		const pluginInstance = arkenvPlugin({
			PORT: "number.port",
			DATABASE_URL: "string",
			VITE_API_URL: "string",
			VITE_DEBUG: "boolean",
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

		// Verify only VITE_* variables are exposed
		expect(result.define).toEqual({
			"import.meta.env.VITE_API_URL": '"https://api.example.com"',
			"import.meta.env.VITE_DEBUG": "true",
		});
		// Verify server-only variables are NOT exposed
		expect(result.define).not.toHaveProperty("import.meta.env.PORT");
		expect(result.define).not.toHaveProperty("import.meta.env.DATABASE_URL");
	});

	it("should respect custom envPrefix configuration", () => {
		// Mock createEnv to return variables with different prefixes
		const mockTransformedEnv = {
			PUBLIC_API_URL: "https://api.example.com",
			PUBLIC_DEBUG: true,
			VITE_OLD_VAR: "should not be exposed",
			SECRET_KEY: "should not be exposed",
		};
		mockCreateEnv.mockReturnValue(mockTransformedEnv);

		const pluginInstance = arkenvPlugin({
			PUBLIC_API_URL: "string",
			PUBLIC_DEBUG: "boolean",
			VITE_OLD_VAR: "string",
			SECRET_KEY: "string",
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
			// Pass custom envPrefix in config
			result = pluginInstance.config.call(
				mockContext,
				{ envPrefix: "PUBLIC_" },
				{ mode: "test", command: "build" },
			);
		}

		// Verify only PUBLIC_* variables are exposed
		expect(result.define).toEqual({
			"import.meta.env.PUBLIC_API_URL": '"https://api.example.com"',
			"import.meta.env.PUBLIC_DEBUG": "true",
		});
		// Verify other variables are NOT exposed
		expect(result.define).not.toHaveProperty("import.meta.env.VITE_OLD_VAR");
		expect(result.define).not.toHaveProperty("import.meta.env.SECRET_KEY");
	});

	it("should default to VITE_ prefix when envPrefix is not configured", () => {
		const mockTransformedEnv = {
			VITE_API_URL: "https://api.example.com",
			PUBLIC_DEBUG: true,
		};
		mockCreateEnv.mockReturnValue(mockTransformedEnv);

		const pluginInstance = arkenvPlugin({
			VITE_API_URL: "string",
			PUBLIC_DEBUG: "boolean",
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
			// Pass config without envPrefix (should default to VITE_)
			result = pluginInstance.config.call(
				mockContext,
				{},
				{ mode: "test", command: "build" },
			);
		}

		// Verify only VITE_* variables are exposed (default prefix)
		expect(result.define).toEqual({
			"import.meta.env.VITE_API_URL": '"https://api.example.com"',
		});
		// Verify PUBLIC_* variable is NOT exposed (not matching default prefix)
		expect(result.define).not.toHaveProperty("import.meta.env.PUBLIC_DEBUG");
	});

	it("should support array of prefixes in envPrefix configuration", () => {
		// Mock createEnv to return variables with different prefixes
		const mockTransformedEnv = {
			VITE_API_URL: "https://api.example.com",
			PUBLIC_DEBUG: true,
			CUSTOM_PREFIX_VAR: "test",
			SECRET_KEY: "should not be exposed",
		};
		mockCreateEnv.mockReturnValue(mockTransformedEnv);

		const pluginInstance = arkenvPlugin({
			VITE_API_URL: "string",
			PUBLIC_DEBUG: "boolean",
			CUSTOM_PREFIX_VAR: "string",
			SECRET_KEY: "string",
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
			// Pass array of prefixes in config
			result = pluginInstance.config.call(
				mockContext,
				{ envPrefix: ["VITE_", "PUBLIC_", "CUSTOM_PREFIX_"] },
				{ mode: "test", command: "build" },
			);
		}

		// Verify variables matching any prefix in the array are exposed
		expect(result.define).toEqual({
			"import.meta.env.VITE_API_URL": '"https://api.example.com"',
			"import.meta.env.PUBLIC_DEBUG": "true",
			"import.meta.env.CUSTOM_PREFIX_VAR": '"test"',
		});
		// Verify variables not matching any prefix are NOT exposed
		expect(result.define).not.toHaveProperty("import.meta.env.SECRET_KEY");
	});

	it("should use custom envDir when provided in config", async () => {
		mockCreateEnv.mockReturnValue({ VITE_TEST: "test" });

		const pluginInstance = arkenvPlugin({ VITE_TEST: "string" });

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
			// Pass custom envDir in config
			pluginInstance.config.call(
				mockContext,
				{ envDir: "/custom/env/dir" },
				{ mode: "test", command: "build" },
			);
		}

		// Assert that loadEnv was called with the mode ("test"), the custom envDir ("/custom/env/dir"), and the expected prefix ("")
		expect(mockLoadEnv).toHaveBeenCalledWith("test", "/custom/env/dir", "");

		// Verify createEnv was called - the envDir is used by loadEnv internally
		expect(mockCreateEnv).toHaveBeenCalledWith(
			{ VITE_TEST: "string" },
			{
				env: expect.any(Object),
			},
		);
	});

	it("should default to process.cwd() when envDir is not configured", () => {
		mockCreateEnv.mockReturnValue({ VITE_TEST: "test" });

		const pluginInstance = arkenvPlugin({ VITE_TEST: "string" });

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
			// Pass config without envDir (should default to process.cwd())
			pluginInstance.config.call(
				mockContext,
				{},
				{ mode: "test", command: "build" },
			);
		}

		// Assert that loadEnv was called with the mode ("test"), the default envDir (process.cwd()), and the expected prefix ("")
		expect(mockLoadEnv).toHaveBeenCalledWith("test", process.cwd(), "");

		// Verify createEnv was called successfully with default behavior
		expect(mockCreateEnv).toHaveBeenCalledWith(
			{ VITE_TEST: "string" },
			{
				env: expect.any(Object),
			},
		);
	});

	it("should pass arkenvConfig to createEnv when provided", () => {
		mockCreateEnv.mockReturnValue({ VITE_TEST: "test" });

		const pluginInstance = arkenvPlugin(
			{ VITE_TEST: "string" },
			{ validator: "standard" },
		);

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

		// Verify createEnv was called with the arkenvConfig merged with env
		expect(mockCreateEnv).toHaveBeenCalledWith(
			{ VITE_TEST: "string" },
			{
				validator: "standard",
				env: expect.any(Object),
			},
		);
	});
});

// Integration tests using with-env-dir fixture for custom envDir configuration
describe("Custom envDir Configuration (with-env-dir fixture)", () => {
	const withEnvDirFixture = join(fixturesDir, "with-env-dir");
	const customEnvDir = join(withEnvDirFixture, "custom-dir");

	// Expected env vars from custom-dir/env.test fixture
	const expectedEnvVars = {
		VITE_CUSTOM_VAR: "custom-value",
		VITE_FROM_ENV_DIR: "loaded-from-env-dir",
	} as const;

	// Reusable build config factory
	const createBuildConfig = (
		envDir: string,
		schema: Record<string, string>,
	) => ({
		mode: "test" as const,
		configFile: false as const,
		root: withEnvDirFixture,
		envDir,
		plugins: [arkenvPlugin(schema)],
		logLevel: "error" as const,
		build: {
			lib: { entry: "index.ts", formats: ["es" as const] },
			rollupOptions: { external: ["arkenv"] },
		},
	});

	beforeEach(() => {
		vi.unstubAllEnvs();
		mockCreateEnv.mockClear();
		mockLoadEnv.mockClear();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		mockCreateEnv.mockClear();
		mockLoadEnv.mockClear();
	});

	it("should load environment variables from custom envDir", async () => {
		const config = await readTestConfig(withEnvDirFixture);

		await expect(
			vite.build(createBuildConfig(customEnvDir, config.Env)),
		).resolves.not.toThrow();

		expect(mockCreateEnv).toHaveBeenCalledWith(config.Env, {
			env: expect.objectContaining(expectedEnvVars),
		});
	});

	it("should fail validation when envDir points to non-existent directory", async () => {
		const config = await readTestConfig(withEnvDirFixture);
		const nonExistentEnvDir = join(withEnvDirFixture, "non-existent-dir");

		await expect(
			vite.build(createBuildConfig(nonExistentEnvDir, config.Env)),
		).rejects.toThrow();

		expect(mockCreateEnv).toHaveBeenCalledWith(config.Env, {
			env: expect.any(Object),
		});
	});

	it("should fail when using root directory without .env files", async () => {
		const config = await readTestConfig(withEnvDirFixture);
		const emptyEnvDir = join(withEnvDirFixture, "empty-dir");

		await expect(
			vite.build(createBuildConfig(emptyEnvDir, config.Env)),
		).rejects.toThrow();
	});

	it("should prioritize envDir over root when both are specified", async () => {
		const config = await readTestConfig(withEnvDirFixture);

		await expect(
			vite.build(createBuildConfig(customEnvDir, config.Env)),
		).resolves.not.toThrow();

		expect(mockCreateEnv).toHaveBeenCalledWith(config.Env, {
			env: expect.objectContaining(expectedEnvVars),
		});
	});

	it("should pass all loaded env vars to createEnv, not just schema keys", async () => {
		const config = await readTestConfig(withEnvDirFixture);
		const envWithExtra = {
			...expectedEnvVars,
			EXTRA_VAR: "extra-value",
		};

		await vite.build(createBuildConfig(customEnvDir, config.Env));

		// Verify that all env vars (including non-schema ones) are passed
		expect(mockCreateEnv).toHaveBeenCalledWith(config.Env, {
			env: expect.objectContaining(envWithExtra),
		});
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

	// Read and merge environment variables from .env files (matching Vite's loadEnv behavior)
	let envVars: Record<string, string> = {};
	const envFiles = [".env", ".env.local", ".env.test"];

	for (const envFile of envFiles) {
		try {
			const envContent = readFileSync(join(fixtureDir, envFile), "utf-8");
			const fileVars = Object.fromEntries(
				envContent
					.split("\n")
					.filter((line) => line.trim() && !line.startsWith("#"))
					.map((line) => {
						const [key, ...valueParts] = line.split("=");
						return [key.trim(), valueParts.join("=").trim()];
					}),
			);
			// Merge with precedence: later files override earlier ones
			envVars = { ...envVars, ...fileVars };
		} catch {
			// Try next file
		}
	}

	return {
		root: fixtureDir,
		Env,
		envVars,
	};
}
