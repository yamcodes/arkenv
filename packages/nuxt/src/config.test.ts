import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

let useMockWatcher = false;
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockWatch = vi.fn().mockImplementation(() => {
	return {
		on: vi.fn().mockReturnThis(),
		close: mockClose,
	};
});

vi.mock("chokidar", async (importOriginal) => {
	const original = await importOriginal<typeof import("chokidar")>();
	return {
		...original,
		watch: (schemaPath: any, options?: any) => {
			if (useMockWatcher) {
				return mockWatch(schemaPath, options);
			}
			return original.watch(schemaPath, options);
		},
	};
});

import {
	extractClientKeys,
	extractKeys,
	extractServerKeys,
	extractSharedKeys,
	resolveLayout,
	runCodegen,
	watchSchema,
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

	it("should close the previous watcher when initialized multiple times in development", async () => {
		useMockWatcher = true;
		mockWatch.mockClear();
		mockClose.mockClear();

		const tempDir = path.join(__dirname, "temp-watcher-test");
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}
		const schemaPath = path.join(tempDir, "env.ts");
		const outputPath = path.join(tempDir, "env.gen.ts");

		fs.writeFileSync(
			schemaPath,
			`export const env = createEnv({ client: { NUXT_PUBLIC_API_URL: "string" } });`,
			"utf-8",
		);

		try {
			// Call watchSchema once
			watchSchema(schemaPath, outputPath, "simple");
			expect(mockWatch).toHaveBeenCalledTimes(1);

			// Call watchSchema a second time
			watchSchema(schemaPath, outputPath, "simple");
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(mockWatch).toHaveBeenCalledTimes(2);

			expect(mockClose).toHaveBeenCalledTimes(1);
		} finally {
			delete (globalThis as any).__arkenv_nuxt_watcher__;
			useMockWatcher = false;
			if (fs.existsSync(tempDir)) {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		}
	});
});
