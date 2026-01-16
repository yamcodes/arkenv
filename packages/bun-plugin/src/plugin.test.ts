import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { arkenv } from "./plugin";

describe("Bun Plugin", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		process.env = originalEnv;
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
});
