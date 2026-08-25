import { describe, expect, it } from "vitest";
import { classifyEnvKeys } from "./classify-env-keys";

describe("classifyEnvKeys", () => {
	it("classifies flat keys with a single prefix", () => {
		const content = `
			export const env = arkenv({
				DATABASE_URL: "string",
				VITE_API_URL: "string",
				NODE_ENV: "'development' | 'production'",
			});
		`;
		const res = classifyEnvKeys(content, ["VITE_"]);
		expect(res.clientKeys).toEqual(["VITE_API_URL"]);
		expect(res.sharedKeys).toEqual(["NODE_ENV"]);
		expect(res.serverKeys).toEqual(["DATABASE_URL"]);
	});

	it("classifies flat keys with multiple prefixes", () => {
		const content = `
			export const env = arkenv({
				DATABASE_URL: "string",
				VITE_API_URL: "string",
				PUBLIC_CDN: "string",
				PORT: "number",
			});
		`;
		const res = classifyEnvKeys(content, ["VITE_", "PUBLIC_"]);
		expect(res.clientKeys).toContain("VITE_API_URL");
		expect(res.clientKeys).toContain("PUBLIC_CDN");
		expect(res.serverKeys).toEqual(["DATABASE_URL", "PORT"]);
	});

	it("handles empty prefixes gracefully", () => {
		const content = `
			export const env = arkenv({
				DATABASE_URL: "string",
				NODE_ENV: "string",
			});
		`;
		const res = classifyEnvKeys(content, []);
		expect(res.serverKeys).toContain("DATABASE_URL");
		expect(res.sharedKeys).toContain("NODE_ENV");
		expect(res.clientKeys).toEqual([]);
	});
});
