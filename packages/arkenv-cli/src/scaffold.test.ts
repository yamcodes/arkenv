import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as prompts from "@clack/prompts";
import { exec as execCallback } from "node:child_process";
import { checkTsConfig, detectFramework, scaffold } from "./scaffold";

vi.mock("@clack/prompts", () => ({
	confirm: vi.fn(),
}));

vi.mock("node:child_process", () => ({
	exec: vi.fn((cmd, cb) => cb(null, { stdout: "", stderr: "" })),
}));

describe("scaffold", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "arkenv-cli-test-"));
		vi.spyOn(process, "cwd").mockReturnValue(tempDir);
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await fsp.rm(tempDir, { recursive: true, force: true });
	});

	describe("helpers", () => {
		describe("checkTsConfig", () => {
			it("returns not_found when no tsconfig exists", async () => {
				const result = await checkTsConfig();
				expect(result.status).toBe("not_found");
			});

			it("returns strict when tsconfig has strict: true", async () => {
				await fsp.writeFile(
					path.join(tempDir, "tsconfig.json"),
					JSON.stringify({ compilerOptions: { strict: true } }),
				);
				const result = await checkTsConfig();
				expect(result.status).toBe("strict");
			});
		});

		describe("detectFramework", () => {
			it("defaults to node when no signals are found", async () => {
				const result = await detectFramework();
				expect(result).toBe("node");
			});

			it("detects vite from vite.config.ts", async () => {
				await fsp.writeFile(path.join(tempDir, "vite.config.ts"), "");
				const result = await detectFramework();
				expect(result).toBe("vite");
			});
		});
	});

	describe("scaffold function", () => {
		const defaultOptions = {
			validator: "arktype" as const,
			framework: "node" as const,
			path: "env.ts",
			shouldUpdateTsConfig: false,
			shouldInstall: true,
		};

		it("creates a new env file in an empty path", async () => {
			await scaffold(defaultOptions);
			const exists = await fsp
				.access(path.join(tempDir, "env.ts"))
				.then(() => true)
				.catch(() => false);
			expect(exists).toBe(true);
			const content = await fsp.readFile(path.join(tempDir, "env.ts"), "utf-8");
			expect(content).toContain("import arkenv, { type } from \"arkenv\"");
		});

		it("does not overwrite existing file when declined", async () => {
			const existingContent = "existing";
			await fsp.writeFile(path.join(tempDir, "env.ts"), existingContent);
			vi.mocked(prompts.confirm).mockResolvedValue(false);

			await scaffold(defaultOptions);

			const content = await fsp.readFile(path.join(tempDir, "env.ts"), "utf-8");
			expect(content).toBe(existingContent);
		});

		it("overwrites existing file when accepted", async () => {
			const existingContent = "existing";
			await fsp.writeFile(path.join(tempDir, "env.ts"), existingContent);
			vi.mocked(prompts.confirm).mockResolvedValue(true);

			await scaffold(defaultOptions);

			const content = await fsp.readFile(path.join(tempDir, "env.ts"), "utf-8");
			expect(content).not.toBe(existingContent);
			expect(content).toContain("arkenv");
		});

		it("updates tsconfig to strict when requested", async () => {
			await fsp.writeFile(
				path.join(tempDir, "tsconfig.json"),
				JSON.stringify({ compilerOptions: { strict: false } }),
			);

			await scaffold({ ...defaultOptions, shouldUpdateTsConfig: true });

			const tsConfig = JSON.parse(
				await fsp.readFile(path.join(tempDir, "tsconfig.json"), "utf-8"),
			);
			expect(tsConfig.compilerOptions.strict).toBe(true);
		});

		it("installs correct dependencies for vite", async () => {
			await scaffold({ ...defaultOptions, framework: "vite" });

			expect(execCallback).toHaveBeenCalledWith(
				expect.stringContaining("arkenv arktype @arkenv/vite-plugin"),
				expect.any(Function),
			);
		});

		it("installs correct dependencies for bun", async () => {
			await scaffold({ ...defaultOptions, framework: "bun" });

			expect(execCallback).toHaveBeenCalledWith(
				expect.stringContaining("arkenv arktype @arkenv/bun-plugin"),
				expect.any(Function),
			);
		});

		it("propagates install failure", async () => {
			vi.mocked(execCallback).mockImplementation((cmd, cb) => {
				(cb as any)(new Error("Install failed"), { stdout: "", stderr: "error" });
				return {} as any;
			});

			await expect(scaffold(defaultOptions)).rejects.toThrow("Install failed");
		});
	});
});
