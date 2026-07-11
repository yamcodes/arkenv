import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { safeAppend } from "./injection";

describe("safeAppend", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fsp.mkdtemp(
			path.join(os.tmpdir(), "arkenv-injection-test-"),
		);
	});

	afterEach(async () => {
		await fsp.rm(tempDir, { recursive: true, force: true });
	});

	it("appends vite types to an existing file", async () => {
		const dtsPath = path.join(tempDir, "vite-env.d.ts");
		const schemaPath = path.join(tempDir, "src", "env.ts");
		await fsp.mkdir(path.dirname(schemaPath), { recursive: true });

		const initialContent = '/// <reference types="vite/client" />\n';
		await fsp.writeFile(dtsPath, initialContent);

		const result = await safeAppend(dtsPath, schemaPath, "vite");

		expect(result).toBe(true);
		const content = await fsp.readFile(dtsPath, "utf-8");
		expect(content).toContain(initialContent);
		expect(content).toContain("// @arkenv-types");
		expect(content).toContain('import("./src/env")');
		expect(content).toContain(
			"interface ImportMetaEnv extends ImportMetaEnvAugmented",
		);
	});

	it("appends bun types to an existing file", async () => {
		const dtsPath = path.join(tempDir, "bun-env.d.ts");
		const schemaPath = path.join(tempDir, "env.ts");

		const initialContent = '/// <reference types="bun-types" />\n';
		await fsp.writeFile(dtsPath, initialContent);

		const result = await safeAppend(dtsPath, schemaPath, "bun-fullstack");

		expect(result).toBe(true);
		const content = await fsp.readFile(dtsPath, "utf-8");
		expect(content).toContain(initialContent);
		expect(content).toContain("// @arkenv-types");
		expect(content).toContain('import("./env")');
		expect(content).toContain("declare namespace NodeJS");
	});

	it("skips if marker is already present", async () => {
		const dtsPath = path.join(tempDir, "vite-env.d.ts");
		const schemaPath = path.join(tempDir, "env.ts");

		const initialContent = "// @arkenv-types\nexisting";
		await fsp.writeFile(dtsPath, initialContent);

		const result = await safeAppend(dtsPath, schemaPath, "vite");

		expect(result).toBe(false);
		const content = await fsp.readFile(dtsPath, "utf-8");
		expect(content).toBe(initialContent);
	});

	it("skips if Vite types are already present without marker", async () => {
		const dtsPath = path.join(tempDir, "vite-env.d.ts");
		const schemaPath = path.join(tempDir, "env.ts");

		const initialContent = `
type ImportMetaEnvAugmented = import("@arkenv/vite-plugin").ImportMetaEnvAugmented<
	typeof import("./env").Env
>;
`;
		await fsp.writeFile(dtsPath, initialContent);

		const result = await safeAppend(dtsPath, schemaPath, "vite");

		expect(result).toBe(false);
		const content = await fsp.readFile(dtsPath, "utf-8");
		expect(content).toBe(initialContent);
	});

	it("skips if Bun types are already present without marker", async () => {
		const dtsPath = path.join(tempDir, "bun-env.d.ts");
		const schemaPath = path.join(tempDir, "env.ts");

		const initialContent = `
type ProcessEnvAugmented = import("@arkenv/bun-plugin").ProcessEnvAugmented<
	typeof import("./env").Env
>;
`;
		await fsp.writeFile(dtsPath, initialContent);

		const result = await safeAppend(dtsPath, schemaPath, "bun-fullstack");

		expect(result).toBe(false);
		const content = await fsp.readFile(dtsPath, "utf-8");
		expect(content).toBe(initialContent);
	});

	it("correctly calculates complex relative paths", async () => {
		const dtsPath = path.join(tempDir, "deep", "nested", "vite-env.d.ts");
		const schemaPath = path.join(tempDir, "src", "config", "env.ts");
		await fsp.mkdir(path.dirname(dtsPath), { recursive: true });
		await fsp.mkdir(path.dirname(schemaPath), { recursive: true });

		await fsp.writeFile(dtsPath, "");

		await safeAppend(dtsPath, schemaPath, "vite");

		const content = await fsp.readFile(dtsPath, "utf-8");
		// from deep/nested to src/config/env -> ../../src/config/env
		expect(content).toContain('import("../../src/config/env")');
	});

	it("logs via logBuildErrorWithCause when append fails without a logger", async () => {
		const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const dtsPath = path.join(tempDir, "missing", "vite-env.d.ts");
		const schemaPath = path.join(tempDir, "env.ts");

		const result = await safeAppend(dtsPath, schemaPath, "vite");

		expect(result).toBe(false);
		expect(logSpy).toHaveBeenCalledTimes(2);
		expect(logSpy.mock.calls[0][0]).toContain("Failed to append to");
		expect(logSpy.mock.calls[1][0]).toContain("ENOENT");
		logSpy.mockRestore();
	});

	it("routes append failures through the provided logger with full cause", async () => {
		const logger = { error: vi.fn() };
		const dtsPath = path.join(tempDir, "missing", "vite-env.d.ts");
		const schemaPath = path.join(tempDir, "env.ts");

		const result = await safeAppend(dtsPath, schemaPath, "vite", logger);

		expect(result).toBe(false);
		expect(logger.error).toHaveBeenCalledTimes(2);
		expect(logger.error.mock.calls[0][0]).toContain(dtsPath);
		expect(logger.error.mock.calls[1][0]).toContain("ENOENT");
	});
});
