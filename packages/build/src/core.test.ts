import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	assertFlatSchemaFile,
	extractKeys,
	findSchemaPath,
	formatMissingSchemaError,
} from "./core";

describe("@arkenv/build schema discovery", () => {
	const makeTempDir = () =>
		fs.mkdtempSync(path.join(os.tmpdir(), "arkenv-build-schema-"));

	it("findSchemaPath discovers src/env.ts", () => {
		const tempDir = makeTempDir();
		try {
			const srcDir = path.join(tempDir, "src");
			fs.mkdirSync(srcDir, { recursive: true });
			const envFile = path.join(srcDir, "env.ts");
			fs.writeFileSync(envFile, "export const env = {}");
			expect(findSchemaPath(tempDir)).toBe(envFile);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("findSchemaPath discovers env.ts at project root", () => {
		const tempDir = makeTempDir();
		try {
			const envFile = path.join(tempDir, "env.ts");
			fs.writeFileSync(envFile, "export const env = {}");
			expect(findSchemaPath(tempDir)).toBe(envFile);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("findSchemaPath does not discover env/ directories", () => {
		const tempDir = makeTempDir();
		try {
			const envDir = path.join(tempDir, "env");
			fs.mkdirSync(envDir, { recursive: true });
			fs.writeFileSync(path.join(envDir, "client.ts"), "export const env = {}");
			fs.writeFileSync(path.join(envDir, "server.ts"), "export const env = {}");
			expect(findSchemaPath(tempDir)).toBeNull();
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("assertFlatSchemaFile rejects directories", () => {
		const tempDir = makeTempDir();
		try {
			fs.writeFileSync(
				path.join(tempDir, "client.ts"),
				"export const env = {}",
			);
			expect(() =>
				assertFlatSchemaFile(tempDir, "ArkEnv Vite plugin:"),
			).toThrow(/only supports a flat env module file/);
			expect(() =>
				assertFlatSchemaFile(tempDir, "ArkEnv Vite plugin:"),
			).toThrow(/Point schemaPath at that file\./);
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

describe("formatMissingSchemaError", () => {
	it("formats a short host error with npx arkenv init and no starter", () => {
		const message = formatMissingSchemaError({
			optionsHint: "setupArkEnv options",
		});

		expect(message).toBe(
			"[ArkEnv] Could not find schema file at src/env.ts or env.ts. Please specify 'schemaPath' in setupArkEnv options (or run `npx arkenv init`).",
		);
		expect(message).not.toMatch(/```/);
		expect(message).not.toMatch(/Example/);
	});

	it("includes checked paths when provided", () => {
		const message = formatMissingSchemaError({
			prefix: "ArkEnv Vite plugin:",
			optionsHint: "plugin options",
			checkedPaths: ["/proj/src/env.ts", "/proj/env.ts"],
		});

		expect(message).toContain("ArkEnv Vite plugin: Could not find schema file");
		expect(message).toContain("Checked paths:");
		expect(message).toContain(" - /proj/src/env.ts");
		expect(message).toContain("npx arkenv init");
	});
});
