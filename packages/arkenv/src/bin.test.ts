import { exec as execCallback } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const exec = promisify(execCallback);
const shimPath = fileURLToPath(new URL("../bin.mjs", import.meta.url));

describe("committed bin shim", () => {
	it("exists so pnpm can link the CLI before dist is built", async () => {
		const pkg = JSON.parse(
			await readFile(new URL("../package.json", import.meta.url), "utf8"),
		) as { bin: { arkenv: string }; files: string[] };
		expect(pkg.bin.arkenv).toBe("./bin.mjs");
		expect(pkg.files).toContain("bin.mjs");
		const shim = await readFile(shimPath, "utf8");
		expect(shim.startsWith("#!/usr/bin/env node")).toBe(true);
	});

	it("forwards to dist/bin.js when the CLI is built", async () => {
		const { stdout } = await exec(`node ${JSON.stringify(shimPath)} --help`);
		expect(stdout).toContain("Usage:");
	});

	it("prints a build hint when dist/bin.js is missing", async () => {
		const dir = await mkdtemp(path.join(tmpdir(), "arkenv-bin-"));
		try {
			const isolated = path.join(dir, "bin.mjs");
			await copyFile(shimPath, isolated);
			await expect(
				exec(`node ${JSON.stringify(isolated)}`),
			).rejects.toMatchObject({
				code: 1,
				stderr: expect.stringContaining("not built yet"),
			});
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});
