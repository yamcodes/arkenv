import { exec as execCallback } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const exec = promisify(execCallback);
const cliPath = path.resolve(__dirname, "../dist/index.cjs");

describe("cli smoke tests", () => {
	it("--help prints usage and exits 0", async () => {
		const { stdout, stderr } = await exec(`node ${cliPath} --help`);
		expect(stdout).toContain("Usage:");
		expect(stdout).toContain("arkenv init");
		expect(stderr).toBe("");
	});

	it("-h prints usage and exits 0", async () => {
		const { stdout } = await exec(`node ${cliPath} -h`);
		expect(stdout).toContain("Usage:");
	});

	it("unknown command prints usage and exits 1", async () => {
		await expect(exec(`node ${cliPath} unknown`)).rejects.toMatchObject({
			code: 1,
			stdout: expect.stringContaining("Usage:"),
		});
	});

	it("running without arguments prints usage and exits 1", async () => {
		await expect(exec(`node ${cliPath}`)).rejects.toMatchObject({
			code: 1,
			stdout: expect.stringContaining("Usage:"),
		});
	});

	it("--yes works with --help", async () => {
		const { stdout, stderr } = await exec(`node ${cliPath} --help --yes`);
		expect(stdout + stderr).toContain("Usage:");
	});

	it("--json works with --help", async () => {
		const { stdout, stderr } = await exec(`node ${cliPath} --help --json`);
		expect(stdout + stderr).toContain("Usage:");
	});

	it("--quiet works with --help", async () => {
		const { stdout, stderr } = await exec(`node ${cliPath} --help --quiet`);
		expect(stdout + stderr).toContain("Usage:");
	});

	it("--agent works with --help", async () => {
		const { stdout, stderr } = await exec(`node ${cliPath} --help --agent`);
		expect(stdout + stderr).toContain("Usage:");
	});

	it("respects INIT_CWD environment variable for execution directory", async () => {
		const uuid = Math.random().toString(36).substring(7);
		const tempDir = path.resolve(__dirname, `../tmp-smoke-${uuid}`);
		await fs.mkdir(tempDir, { recursive: true });
		await fs.writeFile(
			path.join(tempDir, "package.json"),
			JSON.stringify({ name: `temp-pkg-${uuid}`, private: true }, null, 2),
		);

		try {
			const { stdout } = await exec(`node ${cliPath} init --agent --yes`, {
				env: {
					...process.env,
					INIT_CWD: tempDir,
					SKIP_INSTALL: "true",
				},
			});

			expect(stdout).toContain('"status": "success"');

			const envFileExists = await fs
				.access(path.join(tempDir, "env.ts"))
				.then(() => true)
				.catch(() => false);
			expect(envFileExists).toBe(true);
		} finally {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});
});
