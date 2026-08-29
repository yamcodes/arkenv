import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	isDotEnvFile,
	isEnvModuleId,
	normalizeModuleId,
	normalizePrefixes,
	resolveEnvModulePath,
} from "./env-module-path";

describe("env-module-path utilities", () => {
	const tempDirs: string[] = [];

	afterEach(() => {
		for (const dir of tempDirs.splice(0)) {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});

	it("normalizeModuleId strips null byte and query strings", () => {
		expect(normalizeModuleId("\0/project/src/env.ts?import")).toBe(
			path.normalize("/project/src/env.ts"),
		);
		expect(normalizeModuleId("/project/src/env.ts?t=12345")).toBe(
			path.normalize("/project/src/env.ts"),
		);
		expect(normalizeModuleId("/project/src/env.ts")).toBe(
			path.normalize("/project/src/env.ts"),
		);
	});

	it("isEnvModuleId matches modules with query strings and extensions", () => {
		const schemaPath = "/app/src/env.ts";
		expect(isEnvModuleId("/app/src/env.ts", schemaPath)).toBe(true);
		expect(isEnvModuleId("/app/src/env.ts?v=1", schemaPath)).toBe(true);
		expect(isEnvModuleId("/app/src/env.js", schemaPath)).toBe(true);
		expect(isEnvModuleId("\0/app/src/env.ts", schemaPath)).toBe(true);
		expect(isEnvModuleId("/app/src/other.ts", schemaPath)).toBe(false);
	});

	it("normalizePrefixes handles undefined, string, and array", () => {
		expect(normalizePrefixes(undefined, ["VITE_"])).toEqual(["VITE_"]);
		expect(normalizePrefixes(undefined, "BUN_PUBLIC_")).toEqual([
			"BUN_PUBLIC_",
		]);
		expect(normalizePrefixes("CUSTOM_")).toEqual(["CUSTOM_"]);
		expect(normalizePrefixes(["A_", "B_"])).toEqual(["A_", "B_"]);
	});

	it("isDotEnvFile detects dotenv files", () => {
		expect(isDotEnvFile(".env")).toBe(true);
		expect(isDotEnvFile(".env.local")).toBe(true);
		expect(isDotEnvFile(".env.production")).toBe(true);
		expect(isDotEnvFile("/path/to/.env.test")).toBe(true);
		expect(isDotEnvFile("env.ts")).toBe(false);
		expect(isDotEnvFile("package.json")).toBe(false);
	});

	it("resolveEnvModulePath resolves schemaPath or discovers default schema file", () => {
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arkenv-resolve-path-"));
		tempDirs.push(tmp);

		const srcDir = path.join(tmp, "src");
		fs.mkdirSync(srcDir, { recursive: true });
		const envFile = path.join(srcDir, "env.ts");
		fs.writeFileSync(envFile, "export const env = {};");

		expect(resolveEnvModulePath(tmp)).toBe(envFile);
		expect(resolveEnvModulePath(tmp, "src/env.ts")).toBe(envFile);

		expect(() => resolveEnvModulePath(tmp, "nonexistent.ts")).toThrow(
			/does not exist/,
		);
	});

	it("resolveEnvModulePath rejects schema directories", () => {
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arkenv-resolve-dir-"));
		tempDirs.push(tmp);

		const envDir = path.join(tmp, "env");
		fs.mkdirSync(envDir, { recursive: true });
		fs.writeFileSync(path.join(envDir, "client.ts"), "export const env = {};");
		fs.writeFileSync(path.join(envDir, "server.ts"), "export const env = {};");

		expect(() => resolveEnvModulePath(tmp)).toThrow(
			/Could not find schema file/,
		);
		expect(() => resolveEnvModulePath(tmp, "env")).toThrow(
			/only supports a flat env module file/,
		);
	});
});
