import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractKeys, resolveLayout } from "./core";

describe("@arkenv/build layout resolution", () => {
	it("treats flat as simple layout", () => {
		const tempDir = path.join(__dirname, "temp-flat-layout-test");
		fs.mkdirSync(tempDir, { recursive: true });
		try {
			const schemaPath = path.join(tempDir, "env.ts");
			fs.writeFileSync(schemaPath, "export const env = {}");
			const res = resolveLayout(schemaPath, "flat");
			expect(res.layout).toBe("simple");
			expect(res.baseDir).toBe(schemaPath);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("extracts keys from flat layout schema with NUXT_PUBLIC_ prefix", () => {
		const content = `
			export const env = arkenv({
				DATABASE_URL: "string",
				NUXT_PUBLIC_API_URL: "string",
				NODE_ENV: "string",
				CUSTOM_VAR: "string"
			}, {
				exposeToClient: ["CUSTOM_VAR"]
			});
		`;
		const res = extractKeys(content, "NUXT_PUBLIC_");
		expect(res.isLegacy).toBe(false);
		expect(res.serverKeys).toEqual(["DATABASE_URL"]);
		expect(res.clientKeys).toEqual(["NUXT_PUBLIC_API_URL"]);
		expect(res.sharedKeys).toEqual(["NODE_ENV", "CUSTOM_VAR"]);
	});

	it("extracts flat keys when schema values contain delimiter-like characters", () => {
		const content = `
			export const env = arkenv({
				DATABASE_URL: "string",
				DESCRIPTION: "host={localhost},port=5432",
				NUXT_PUBLIC_API_URL: "string",
			});
		`;
		const res = extractKeys(content, "NUXT_PUBLIC_");
		expect(res.serverKeys).toEqual(["DATABASE_URL", "DESCRIPTION"]);
		expect(res.clientKeys).toEqual(["NUXT_PUBLIC_API_URL"]);
	});
});
