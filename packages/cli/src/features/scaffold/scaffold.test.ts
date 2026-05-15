import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkTsConfig, detectFramework } from "./scaffold";

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
});
