import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
	extractClientKeys,
	extractKeys,
	extractServerKeys,
	extractSharedKeys,
	resolveLayout,
} from "./config";

describe("Nuxt config parser", () => {
	it("should resolve simple layout", () => {
		const tempDir = path.join(__dirname, "temp-simple-test");
		fs.mkdirSync(tempDir, { recursive: true });
		try {
			const schemaPath = path.join(tempDir, "env.ts");
			fs.writeFileSync(schemaPath, "export const Env = {}");
			const res = resolveLayout(schemaPath);
			expect(res.layout).toBe("simple");
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should resolve strict layout", () => {
		const tempDir = path.join(__dirname, "temp-strict-test");
		fs.mkdirSync(tempDir, { recursive: true });
		fs.mkdirSync(path.join(tempDir, "internal"), { recursive: true });
		try {
			fs.writeFileSync(
				path.join(tempDir, "client.ts"),
				"export const env = {}",
			);
			fs.writeFileSync(
				path.join(tempDir, "server.ts"),
				"export const env = {}",
			);
			fs.writeFileSync(
				path.join(tempDir, "internal", "shared.ts"),
				"export const SharedSchema = {}",
			);

			const res = resolveLayout(path.join(tempDir, "client.ts"));
			expect(res.layout).toBe("strict");
			expect(res.baseDir).toBe(tempDir);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should extract keys in simple layout", () => {
		const content = `
			export const env = arkenv({
				server: {
					DATABASE_URL: "string",
					ADMIN_KEY: "string"
				},
				client: {
					NUXT_PUBLIC_API_URL: "string"
				},
				shared: {
					NODE_ENV: "string"
				}
			});
		`;

		const res = extractKeys(content);
		expect(res.serverKeys).toEqual(["DATABASE_URL", "ADMIN_KEY"]);
		expect(res.clientKeys).toEqual(["NUXT_PUBLIC_API_URL"]);
		expect(res.sharedKeys).toEqual(["NODE_ENV"]);
	});

	it("should extract keys in flat layout", () => {
		const content = `
			export const env = arkenv({
				DATABASE_URL: "string",
				NUXT_PUBLIC_API_URL: "string",
				NODE_ENV: "string",
				CUSTOM_SHARED: "string",
			}, {
				exposeToClient: ["CUSTOM_SHARED"],
			});
		`;

		const res = extractKeys(content);
		expect(res.serverKeys).toEqual(["DATABASE_URL"]);
		expect(res.clientKeys).toEqual(["NUXT_PUBLIC_API_URL"]);
		expect(res.sharedKeys).toEqual(["NODE_ENV", "CUSTOM_SHARED"]);
	});

	it("should handle parser edge cases with comments, nested objects, and templates", () => {
		const content = `
			export const env = arkenv({
				server: {
					// A single line comment
					DATABASE_URL: "string", /* inline comment */
					/* 
					   Multi-line comment 
					*/
					ADMIN_KEY: "string",
					NESTED: {
						A: "string"
					}
				},
				client: {
					NUXT_PUBLIC_API_URL: "string = 'http://localhost'",
					// NUXT_PUBLIC_IGNORE: "string"
					NUXT_PUBLIC_TEMPLATE: \`string:\${1}\`
				},
				shared: {
					NODE_ENV: "string"
				}
			});
		`;

		const res = extractKeys(content);
		expect(res.serverKeys).toEqual(["DATABASE_URL", "ADMIN_KEY", "NESTED"]);
		expect(res.clientKeys).toEqual([
			"NUXT_PUBLIC_API_URL",
			"NUXT_PUBLIC_TEMPLATE",
		]);
		expect(res.sharedKeys).toEqual(["NODE_ENV"]);
	});

	it("should extract client, server, and shared keys in strict layout", () => {
		const clientContent = `
			import arkenv from "@arkenv/nuxt/client";
			export const env = arkenv({
				NUXT_PUBLIC_API_URL: "string"
			});
		`;
		const serverContent = `
			import arkenv from "@arkenv/nuxt/server";
			export const env = arkenv({
				DATABASE_URL: "string"
			});
		`;
		const sharedContent = `
			import { type } from "@arkenv/nuxt/shared";
			export const SharedSchema = type({
				NODE_ENV: "string"
			});
		`;

		expect(extractClientKeys(clientContent)).toEqual(["NUXT_PUBLIC_API_URL"]);
		expect(extractServerKeys(serverContent)).toEqual(["DATABASE_URL"]);
		expect(extractSharedKeys(sharedContent)).toEqual(["NODE_ENV"]);
	});
});
