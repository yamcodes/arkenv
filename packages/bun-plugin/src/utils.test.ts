import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { processEnvSchema } from "./utils";

describe("Bun Plugin Utils", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		process.env = originalEnv;
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

	it("should not filter out NODE_ENV", () => {
		process.env.NODE_ENV = "development";

		const envMap = processEnvSchema({
			NODE_ENV: "'development' | 'test' | 'production'",
		} as const);

		// Check that NODE_ENV is present
		expect(envMap.has("NODE_ENV")).toBe(true);
		expect(envMap.get("NODE_ENV")).toBe(JSON.stringify("development"));
	});
});
