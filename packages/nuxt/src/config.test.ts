import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	extractClientKeys,
	extractKeys,
	extractServerKeys,
	extractSharedKeys,
	resolveLayout,
	runCodegen,
} from "./config";

describe("Nuxt config parser & codegen", () => {
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

	it("should extract client, server, and shared keys in strict layout", () => {
		const clientContent = `
			import arkenv from "./generated/env.gen";
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

	it("should generate codegen output in simple layout", () => {
		const tempDir = path.join(__dirname, "temp-codegen-test");
		fs.mkdirSync(tempDir, { recursive: true });
		try {
			const schemaPath = path.join(tempDir, "env.ts");
			const outputPath = path.join(tempDir, "env.gen.ts");
			fs.writeFileSync(
				schemaPath,
				`
				export const env = arkenv({
					server: { DATABASE_URL: "string" },
					client: { NUXT_PUBLIC_API_URL: "string" },
					shared: { NODE_ENV: "string" }
				});
				`,
			);

			runCodegen(schemaPath, outputPath, "simple");

			const outputContent = fs.readFileSync(outputPath, "utf-8");
			expect(outputContent).toContain(
				'import { createEnv as coreCreateEnv } from "@arkenv/nuxt";',
			);
			expect(outputContent).toContain(
				"NUXT_PUBLIC_API_URL: config?.public?.NUXT_PUBLIC_API_URL ?? process.env.NUXT_PUBLIC_API_URL,",
			);
			expect(outputContent).toContain(
				"DATABASE_URL: config?.DATABASE_URL ?? process.env.DATABASE_URL,",
			);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
