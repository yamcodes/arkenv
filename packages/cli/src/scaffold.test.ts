import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as prompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkTsConfig, detectFramework, scaffold } from "./scaffold";

const { spawnMock } = vi.hoisted(() => ({
	spawnMock: vi.fn().mockReturnValue({
		on: vi.fn((event, cb) => {
			if (event === "close") {
				setTimeout(() => cb(0), 0);
			}
			return this;
		}),
	}),
}));

vi.mock("@clack/prompts", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@clack/prompts")>();
	return {
		...actual,
		confirm: vi.fn(),
	};
});

vi.mock("node:child_process", () => {
	return {
		spawn: spawnMock,
	};
});

describe("scaffold", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "cli-test-"));
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
			language: "ts" as const,
			shouldUpdateTsConfig: false,
			shouldInstall: true,
			installTypeDefinitions: true,
		};

		it("creates a new env file in an empty path", async () => {
			await scaffold(defaultOptions);
			const exists = await fsp
				.access(path.join(tempDir, "env.ts"))
				.then(() => true)
				.catch(() => false);
			expect(exists).toBe(true);
			const content = await fsp.readFile(path.join(tempDir, "env.ts"), "utf-8");
			expect(content).toContain('import arkenv, { type } from "arkenv"');
		});

		it("uses envKeys when provided in options", async () => {
			await scaffold({
				...defaultOptions,
				envKeys: ["API_KEY", "DB_URL"],
			});
			const content = await fsp.readFile(path.join(tempDir, "env.ts"), "utf-8");
			expect(content).toContain('API_KEY: "string"');
			expect(content).toContain('DB_URL: "string"');
			expect(content).not.toContain("NODE_ENV");
		});

		it("does not overwrite existing file when declined", async () => {
			const existingContent = "existing";
			await fsp.writeFile(path.join(tempDir, "env.ts"), existingContent);
			vi.mocked(prompts.confirm).mockResolvedValue(false);

			await scaffold({ ...defaultOptions, overwriteEnvSchemaFile: false });

			const content = await fsp.readFile(path.join(tempDir, "env.ts"), "utf-8");
			expect(content).toBe(existingContent);
		});

		it("overwrites existing file when accepted", async () => {
			const existingContent = "existing";
			await fsp.writeFile(path.join(tempDir, "env.ts"), existingContent);
			vi.mocked(prompts.confirm).mockResolvedValue(true);

			await scaffold({ ...defaultOptions, overwriteEnvSchemaFile: true });

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
			const result = await scaffold({ ...defaultOptions, framework: "vite" });

			expect(result.installCmd).toContain("@arkenv/vite-plugin");
			expect(result.packageManager).toBeDefined();
		});

		it("installs correct dependencies for bun", async () => {
			const result = await scaffold({ ...defaultOptions, framework: "bun" });

			expect(result.installCmd).toContain("@arkenv/bun-plugin");
			expect(result.packageManager).toBeDefined();
		});

		it("returns correct install info in result", async () => {
			const result = await scaffold(defaultOptions);

			expect(result.installCmd).toContain("arkenv");
			expect(result.installCmd).toContain("arktype");
			expect(result.packageManager).toBeDefined();
		});

		it("establishes vite-env.d.ts for vite framework", async () => {
			const result = await scaffold({ ...defaultOptions, framework: "vite" });

			const exists = await fsp
				.access(path.join(tempDir, "vite-env.d.ts"))
				.then(() => true)
				.catch(() => false);
			expect(exists).toBe(true);
			expect(result.typeDefinitionResult.status).toBe("created");
			expect((result.typeDefinitionResult as any).file).toBe("vite-env.d.ts");

			const content = await fsp.readFile(
				path.join(tempDir, "vite-env.d.ts"),
				"utf-8",
			);
			expect(content).toContain("ImportMetaEnvAugmented");
			expect(content).toContain('import("./env")');
		});

		it("establishes bun-env.d.ts for bun framework", async () => {
			const result = await scaffold({ ...defaultOptions, framework: "bun" });

			const exists = await fsp
				.access(path.join(tempDir, "bun-env.d.ts"))
				.then(() => true)
				.catch(() => false);
			expect(exists).toBe(true);
			expect(result.typeDefinitionResult.status).toBe("created");
			expect((result.typeDefinitionResult as any).file).toBe("bun-env.d.ts");

			const content = await fsp.readFile(
				path.join(tempDir, "bun-env.d.ts"),
				"utf-8",
			);
			expect(content).toContain("ProcessEnvAugmented");
			expect(content).toContain('import("./env")');
		});

		it("skips type definition if file exists and overwriteEnvDtsFile is false", async () => {
			await fsp.writeFile(path.join(tempDir, "vite-env.d.ts"), "existing");

			const result = await scaffold({
				...defaultOptions,
				framework: "vite",
				overwriteEnvDtsFile: false,
			});

			const content = await fsp.readFile(
				path.join(tempDir, "vite-env.d.ts"),
				"utf-8",
			);
			expect(content).toBe("existing");
			expect(result.typeDefinitionResult.status).toBe("skipped");
		});

		it("overwrites type definition if file exists and overwriteEnvDtsFile is true", async () => {
			await fsp.writeFile(path.join(tempDir, "vite-env.d.ts"), "existing");

			const result = await scaffold({
				...defaultOptions,
				framework: "vite",
				overwriteEnvDtsFile: true,
			});

			const content = await fsp.readFile(
				path.join(tempDir, "vite-env.d.ts"),
				"utf-8",
			);
			expect(content).not.toBe("existing");
			expect(result.typeDefinitionResult.status).toBe("overwritten");
		});

		it("prompts for type definition overwrite if overwriteEnvDtsFile is undefined", async () => {
			await fsp.writeFile(path.join(tempDir, "vite-env.d.ts"), "existing");
			vi.mocked(prompts.confirm).mockResolvedValue(true);

			const result = await scaffold({
				...defaultOptions,
				framework: "vite",
				overwriteEnvDtsFile: undefined,
			});

			expect(prompts.confirm).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("vite-env.d.ts already exists"),
				}),
			);
			expect(result.typeDefinitionResult.status).toBe("overwritten");
		});

		it("skips type definition installation if installTypeDefinitions is false", async () => {
			const result = await scaffold({
				...defaultOptions,
				framework: "vite",
				installTypeDefinitions: false,
			});

			const exists = await fsp
				.access(path.join(tempDir, "vite-env.d.ts"))
				.then(() => true)
				.catch(() => false);
			expect(exists).toBe(false);
			expect(result.typeDefinitionResult.status).toBe("none");
		});
	});
});
