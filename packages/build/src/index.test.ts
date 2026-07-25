import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	extractArkenvBlock,
	extractBlock,
	extractKeys,
	findSchemaPath,
	formatMissingSchemaError,
	isStrictLayoutDir,
	parseBlockKeys,
	resolveLayout,
} from "./index";

describe("@arkenv/build extractors", () => {
	describe("extractKeys", () => {
		it("should extract keys from legacy nested layout schema", () => {
			const content = `
				export const env = createEnv({
					server: {
						DATABASE_URL: "string",
						ADMIN_TOKEN: "string"
					},
					client: {
						NEXT_PUBLIC_API_URL: "string",
						NEXT_PUBLIC_APP_ENV: "string"
					},
					shared: {
						NODE_ENV: "string"
					}
				});
			`;
			const res = extractKeys(content, "NEXT_PUBLIC_");
			expect(res.isLegacy).toBe(true);
			expect(res.serverKeys).toEqual(["DATABASE_URL", "ADMIN_TOKEN"]);
			expect(res.clientKeys).toEqual([
				"NEXT_PUBLIC_API_URL",
				"NEXT_PUBLIC_APP_ENV",
			]);
			expect(res.sharedKeys).toEqual(["NODE_ENV"]);
		});

		it("should extract keys from flat layout schema with NEXT_PUBLIC_ prefix", () => {
			const content = `
				export const env = createEnv({
					DATABASE_URL: "string",
					NEXT_PUBLIC_API_URL: "string",
					NODE_ENV: "string",
					CUSTOM_VAR: "string"
				}, {
					exposeToClient: ["CUSTOM_VAR"]
				});
			`;
			const res = extractKeys(content, "NEXT_PUBLIC_");
			expect(res.isLegacy).toBe(false);
			expect(res.serverKeys).toEqual(["DATABASE_URL"]);
			expect(res.clientKeys).toEqual(["NEXT_PUBLIC_API_URL"]);
			expect(res.sharedKeys).toEqual(["NODE_ENV", "CUSTOM_VAR"]);
		});

		it("should extract keys from flat layout schema with NUXT_PUBLIC_ prefix", () => {
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
	});

	describe("extractBlock", () => {
		it("should extract a specified block body", () => {
			const content = `
				createEnv({
					server: {
						DB_URL: "string"
					},
					client: {
						API_URL: "string"
					}
				})
			`;
			expect(extractBlock(content, "server")).toBe('DB_URL: "string"');
			expect(extractBlock(content, "client")).toBe('API_URL: "string"');
		});

		it("should return null for non-existent block", () => {
			const content = "createEnv({ server: {} })";
			expect(extractBlock(content, "shared")).toBeNull();
		});
	});

	describe("parseBlockKeys", () => {
		it("should parse standard, quoted, and comment-wrapped keys", () => {
			const content = `
				DATABASE_URL: "string",
				"NUXT_PUBLIC_API_URL": "string",
				'SINGLE_QUOTED': "string",
				// Ignored key: "value",
				/* Multi-line ignored: "value" */
				nested: {
					INNER_KEY: "string"
				},
				PORT: 3000
			`;
			const keys = parseBlockKeys(content);
			expect(keys).toEqual([
				"DATABASE_URL",
				"NUXT_PUBLIC_API_URL",
				"SINGLE_QUOTED",
				"nested",
				"PORT",
			]);
		});
	});

	describe("extractArkenvBlock", () => {
		it("should extract the arkenv block content", () => {
			const content = `
				import { arkenv } from "arkenv";
				export const env = arkenv({
					DATABASE_URL: "string",
					PORT: "number"
				});
			`;
			expect(extractArkenvBlock(content)).toBe(
				'DATABASE_URL: "string",\n\t\t\t\t\tPORT: "number"',
			);
		});
	});
});

describe("strict layout detection", () => {
	const makeTempDir = () =>
		fs.mkdtempSync(path.join(os.tmpdir(), "arkenv-build-layout-"));

	it("treats client.ts + server.ts as strict without internal/shared.ts", () => {
		const tempDir = makeTempDir();
		try {
			fs.writeFileSync(
				path.join(tempDir, "client.ts"),
				"export const env = {}",
			);
			fs.writeFileSync(
				path.join(tempDir, "server.ts"),
				"export const env = {}",
			);

			expect(isStrictLayoutDir(tempDir)).toBe(true);
			expect(resolveLayout(tempDir)).toEqual({
				layout: "strict",
				baseDir: tempDir,
			});
			expect(resolveLayout(path.join(tempDir, "client.ts"))).toEqual({
				layout: "strict",
				baseDir: tempDir,
			});
			expect(resolveLayout(path.join(tempDir, "client.ts"), "strict")).toEqual({
				layout: "strict",
				baseDir: tempDir,
			});
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("findSchemaPath discovers env/ without requiring shared.ts", () => {
		const tempDir = makeTempDir();
		try {
			const envDir = path.join(tempDir, "env");
			fs.mkdirSync(envDir, { recursive: true });
			fs.writeFileSync(path.join(envDir, "client.ts"), "export const env = {}");
			fs.writeFileSync(path.join(envDir, "server.ts"), "export const env = {}");

			expect(findSchemaPath(tempDir)).toBe(envDir);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("findSchemaPath discovers src/env/ without requiring shared.ts", () => {
		const tempDir = makeTempDir();
		try {
			const envDir = path.join(tempDir, "src", "env");
			fs.mkdirSync(envDir, { recursive: true });
			fs.writeFileSync(path.join(envDir, "client.ts"), "export const env = {}");
			fs.writeFileSync(path.join(envDir, "server.ts"), "export const env = {}");

			expect(findSchemaPath(tempDir)).toBe(envDir);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("throws for explicit strict when client.ts is missing", () => {
		const tempDir = makeTempDir();
		try {
			fs.writeFileSync(
				path.join(tempDir, "server.ts"),
				"export const env = {}",
			);
			expect(() =>
				resolveLayout(path.join(tempDir, "missing.ts"), "strict"),
			).toThrow(
				`[ArkEnv] Strict layout requires "${path.join(tempDir, "client.ts")}" to exist`,
			);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

describe("formatMissingSchemaError", () => {
	it("formats a short host error with CLI init and no starter", () => {
		const message = formatMissingSchemaError({
			optionsHint: "setupArkEnv options",
		});

		expect(message).toBe(
			"[ArkEnv] Could not find schema file at src/env.ts or env.ts. Please specify 'schemaPath' in setupArkEnv options (or run `npx @arkenv/cli@latest init`).",
		);
		expect(message).not.toMatch(/```/);
		expect(message).not.toMatch(/Example/);
	});

	it("includes an explicit schemaPath and checked paths when provided", () => {
		const message = formatMissingSchemaError({
			prefix: "@arkenv/bun-plugin:",
			schemaPath: "./missing-env.ts",
			optionsHint: "plugin options",
			checkedPaths: ["/proj/src/env.ts", "/proj/env.ts"],
		});

		expect(message).toContain(
			"@arkenv/bun-plugin: Could not find schema file at ./missing-env.ts. Please specify 'schemaPath' in plugin options (or run `npx @arkenv/cli@latest init`).",
		);
		expect(message).toContain("Checked paths:");
		expect(message).toContain(" - /proj/src/env.ts");
		expect(message).toContain(" - /proj/env.ts");
	});
});
