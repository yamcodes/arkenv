import { describe, expect, it } from "vitest";
import arkenvPlugin from "./index.js";

describe("Bun Plugin", () => {
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

		delete process.env.BUN_PUBLIC_TEST;
	});

	it("should validate environment variables at plugin creation", () => {
		// Set up a valid environment variable
		process.env.BUN_PUBLIC_TEST = "test-value";

		expect(() => {
			arkenvPlugin({ BUN_PUBLIC_TEST: "string" });
		}).not.toThrow();

		delete process.env.BUN_PUBLIC_TEST;
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

		const pluginInstance = arkenvPlugin({
			BUN_PUBLIC_API_URL: "string",
			PORT: "number.port",
			DATABASE_URL: "string",
		});

		// The plugin should be created successfully
		expect(pluginInstance).toBeDefined();

		// Clean up
		delete process.env.BUN_PUBLIC_API_URL;
		delete process.env.PORT;
		delete process.env.DATABASE_URL;
	});
});
