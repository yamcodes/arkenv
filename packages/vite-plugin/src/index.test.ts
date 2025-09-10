import { readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";
import * as vite from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the arkenv module to capture calls
vi.mock("arkenv", () => ({
	__esModule: true,
	default: vi.fn(),
	createEnv: vi.fn(),
}));

import arkenvPlugin from "./index.js";

// Capture snapshot of process.env at module level
const ORIGINAL_ENV = { ...process.env };

const fixturesDir = join(__dirname, "__fixtures__");

// Get the mocked functions
const { createEnv: mockCreateEnv } = await vi.importMock("arkenv");

// Run fixture-based tests
for (const name of readdirSync(fixturesDir)) {
	const fixtureDir = join(fixturesDir, name);

	describe(`Fixture: ${name}`, () => {
		beforeEach(() => {
			// Clean environment start and mock cleanup
			process.env = { ...ORIGINAL_ENV };
			mockCreateEnv.mockClear();
		});

		afterEach(() => {
			// Complete cleanup: restore environment and reset mocks
			process.env = { ...ORIGINAL_ENV };
			mockCreateEnv.mockReset();
		});

		it("should build successfully with the plugin", async () => {
			const config = await readTestConfig(fixtureDir);

			// Set up environment variables from the fixture
			if (config.envVars) {
				Object.assign(process.env, config.envVars);
			}

			await expect(
				vite.build({
					configFile: false,
					root: config.root,
					plugins: [arkenvPlugin(config.envSchema)],
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
				config.envSchema,
				expect.objectContaining(config.envVars || {}),
			);
		});
	});
}

// Unit tests for plugin functionality
describe("Plugin Unit Tests", () => {
	beforeEach(() => {
		process.env = { ...ORIGINAL_ENV };
		mockCreateEnv.mockClear();
	});

	afterEach(() => {
		process.env = { ...ORIGINAL_ENV };
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
		const pluginInstance = arkenvPlugin({ VITE_TEST: "string" });

		// Mock the config hook
		if (pluginInstance.config) {
			pluginInstance.config({}, { mode: "test", command: "build" });
		}

		expect(mockCreateEnv).toHaveBeenCalledWith(
			{ VITE_TEST: "string" },
			expect.any(Object),
		);
	});
});

type TestConfig = ReturnType<typeof readTestConfig>;

async function readTestConfig(fixtureDir: string) {
	// Import the env schema from the TypeScript config file
	let envSchema: Record<string, string> = {};
	try {
		const configPath = join(fixtureDir, "config.ts");
		const configModule = await import(configPath);
		envSchema = configModule.envSchema;
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
		envSchema,
		envVars,
	};
}
