import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
	extractClientKeys,
	extractKeys,
	extractServerKeys,
	extractSharedKeys,
	resolveLayout,
	runCodegen,
	setupArkEnv,
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
});

describe("codegen process", () => {
	const tempDir = path.join(__dirname, "__temp_codegen_tests__");
	const schemaPath = path.join(tempDir, "env.ts");
	const outputPath = path.join(tempDir, "env.gen.ts");

	afterEach(() => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should parse file and write generated flat factory code", () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`
			import arkenv from "./env.gen";
			export const env = arkenv({
				DATABASE_URL: "string",
				NUXT_PUBLIC_API_URL: "string",
				NODE_ENV: "string",
			});
			`,
			"utf-8",
		);

		runCodegen(schemaPath, outputPath);

		expect(fs.existsSync(outputPath)).toBe(true);
		const generatedContent = fs.readFileSync(outputPath, "utf-8");

		// Check warning header
		expect(generatedContent).not.toContain("// @ts-nocheck");
		expect(generatedContent).toContain(
			"Generated by ArkEnv. DO NOT EDIT DIRECTLY.",
		);

		// Check exports and wrapper types
		expect(generatedContent).toContain("export function createEnv<");
		expect(generatedContent).toContain("export default createEnv;");

		// Check package import
		expect(generatedContent).toContain(
			'import { createEnv as coreCreateEnv } from "@arkenv/nuxt";',
		);

		// Check destructured runtimeEnv keys
		expect(generatedContent).toContain(
			'NUXT_PUBLIC_API_URL: typeof window !== "undefined" ? (window as any).__NUXT__?.config?.public?.NUXT_PUBLIC_API_URL ?? process.env.NUXT_PUBLIC_API_URL : process.env.NUXT_PUBLIC_API_URL,',
		);
		expect(generatedContent).toContain(
			'NODE_ENV: typeof window !== "undefined" ? (window as any).__NUXT__?.config?.public?.NODE_ENV ?? process.env.NODE_ENV : process.env.NODE_ENV,',
		);

		// Server-only keys should not appear in runtimeEnv
		expect(generatedContent).not.toContain("DATABASE_URL:");
	});

	it("should handle custom output path", () => {
		const customOutputDir = path.join(tempDir, "generated");
		const customOutputPath = path.join(customOutputDir, "env.gen.ts");

		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`
			export const env = arkenv({
				NUXT_PUBLIC_API_URL: "string",
			});
			`,
			"utf-8",
		);

		runCodegen(schemaPath, customOutputPath);

		expect(fs.existsSync(customOutputPath)).toBe(true);
		const generatedContent = fs.readFileSync(customOutputPath, "utf-8");
		expect(generatedContent).toContain("export function createEnv<");
	});

	it("should support strict layout auto-detection and generation", () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		const strictBaseDir = path.join(tempDir, "env");
		fs.mkdirSync(path.join(strictBaseDir, "internal"), { recursive: true });

		fs.writeFileSync(
			path.join(strictBaseDir, "internal", "shared.ts"),
			`
			import { type } from "@arkenv/nuxt/shared";
			export const SharedSchema = type({
				NODE_ENV: "string = 'development'",
			});
			`,
			"utf-8",
		);

		fs.writeFileSync(
			path.join(strictBaseDir, "client.ts"),
			`
			import arkenv from "@arkenv/nuxt/client";
			import { SharedSchema } from "./internal/shared";
			export const env = arkenv(
				{
					NUXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
				},
				{
					extends: [SharedSchema],
					runtimeEnv: {},
				}
			);
			`,
			"utf-8",
		);

		fs.writeFileSync(
			path.join(strictBaseDir, "server.ts"),
			`
			import arkenv from "@arkenv/nuxt/server";
			export const env = arkenv({
				DATABASE_URL: "string",
			});
			`,
			"utf-8",
		);

		const strictOutputPath = path.join(
			strictBaseDir,
			"generated",
			"env.gen.ts",
		);
		runCodegen(strictBaseDir, strictOutputPath);

		expect(fs.existsSync(strictOutputPath)).toBe(true);
		const generatedContent = fs.readFileSync(strictOutputPath, "utf-8");

		expect(generatedContent).toContain("export function createEnv<");
		expect(generatedContent).toContain("export default createEnv;");
		expect(generatedContent).toContain(
			'import { createEnv as coreCreateEnv } from "@arkenv/nuxt/client";',
		);
		expect(generatedContent).toContain(
			'NUXT_PUBLIC_API_URL: typeof window !== "undefined" ? (window as any).__NUXT__?.config?.public?.NUXT_PUBLIC_API_URL ?? process.env.NUXT_PUBLIC_API_URL : process.env.NUXT_PUBLIC_API_URL,',
		);
		expect(generatedContent).toContain(
			'NODE_ENV: typeof window !== "undefined" ? (window as any).__NUXT__?.config?.public?.NODE_ENV ?? process.env.NODE_ENV : process.env.NODE_ENV,',
		);
		expect(generatedContent).not.toContain("DATABASE_URL");
	});

	it("should throw a descriptive error when layout: 'strict' is set but required files are missing", () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`export const env = arkenv({ client: { NUXT_PUBLIC_VAR: "string" } });`,
			"utf-8",
		);

		expect(() => runCodegen(schemaPath, outputPath, "strict")).toThrow(
			"[ArkEnv] Strict layout requires",
		);
	});
});

describe("setupArkEnv watcher", () => {
	const tempDir = path.join(__dirname, "__temp_watcher_tests__");
	const schemaPath = path.join(tempDir, "env.ts");
	const outputPath = path.join(tempDir, "generated", "env.gen.ts");

	afterEach(() => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should regenerate env.gen.ts when the schema file changes in development", async () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`export const env = arkenv({ NUXT_PUBLIC_API_URL: "string" });`,
			"utf-8",
		);

		const originalNodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";

		try {
			setupArkEnv({ schemaPath, outputPath, validate: false });

			const initialContent = fs.readFileSync(outputPath, "utf-8");
			expect(initialContent).toContain("NUXT_PUBLIC_API_URL");
			expect(initialContent).not.toContain("NUXT_PUBLIC_API_KEY");

			// Wait for the watcher to be ready
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Update the schema file
			fs.writeFileSync(
				schemaPath,
				`export const env = arkenv({ NUXT_PUBLIC_API_URL: "string", NUXT_PUBLIC_API_KEY: "string" });`,
				"utf-8",
			);

			// Wait for the watcher callback to regenerate the file
			await new Promise((resolve) => setTimeout(resolve, 300));

			const updatedContent = fs.readFileSync(outputPath, "utf-8");
			expect(updatedContent).toContain("NUXT_PUBLIC_API_URL");
			expect(updatedContent).toContain("NUXT_PUBLIC_API_KEY");
		} finally {
			process.env.NODE_ENV = originalNodeEnv;
		}
	});
});
