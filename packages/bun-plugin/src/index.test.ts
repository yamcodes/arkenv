import { afterEach, beforeEach, describe, expect, it } from "vitest";
import arkenvPlugin, { processEnvSchema } from "./index.js";

describe("Bun Plugin", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("should create a plugin function", () => {
		expect(typeof arkenvPlugin).toBe("function");
	});

	it("should return a Bun plugin object", () => {
		// Set up a valid environment variable
		process.env.BUN_PUBLIC_TEST = "test-value";

		const pluginInstance = arkenvPlugin({ BUN_PUBLIC_TEST: "string" });

		expect(pluginInstance).toHaveProperty("name", "@arkenv/bun-plugin");
		expect(pluginInstance).toHaveProperty("setup");
		expect(typeof pluginInstance.setup).toBe("function");
	});

	it("should validate environment variables at plugin creation", () => {
		// Set up a valid environment variable
		process.env.BUN_PUBLIC_TEST = "test-value";

		expect(() => {
			arkenvPlugin({ BUN_PUBLIC_TEST: "string" });
		}).not.toThrow();
	});

	it("should throw if environment variable validation fails", () => {
		// Don't set the required environment variable
		delete process.env.BUN_PUBLIC_REQUIRED;

		expect(() => {
			arkenvPlugin({ BUN_PUBLIC_REQUIRED: "string" });
		}).toThrow();
	});

	it("should filter out non-prefixed variables", () => {
		process.env.BUN_PUBLIC_API_URL = "https://api.example.com";
		process.env.PORT = "3000";
		process.env.DATABASE_URL = "postgres://localhost/db";

		const envMap = processEnvSchema({
			BUN_PUBLIC_API_URL: "string",
			PORT: "number.port",
			DATABASE_URL: "string",
		} as const);

		// Check that prefixed variables are present
		expect(envMap.has("BUN_PUBLIC_API_URL")).toBe(true);
		expect(envMap.get("BUN_PUBLIC_API_URL")).toBe(
			JSON.stringify("https://api.example.com"),
		);

		// Check that non-prefixed variables are filtered out
		expect(envMap.has("PORT")).toBe(false);
		expect(envMap.has("DATABASE_URL")).toBe(false);
	});
});
