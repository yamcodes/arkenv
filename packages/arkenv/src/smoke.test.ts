import { exec as execCallback } from "node:child_process";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const exec = promisify(execCallback);
const require = createRequire(import.meta.url);

const cliPath = path.resolve(__dirname, "../dist/bin.cjs");
const esmIndexPath = path.resolve(__dirname, "../dist/index.js");
const cjsIndexPath = path.resolve(__dirname, "../dist/index.cjs");

describe("library import guard", () => {
	it("importing ESM entry throws migration error", async () => {
		await expect(import(pathToFileURL(esmIndexPath).href)).rejects.toThrow(
			"You imported the 'arkenv' package as a library",
		);
	});

	it("requiring CJS entry throws migration error", () => {
		expect(() => require(cjsIndexPath)).toThrow(
			"You imported the 'arkenv' package as a library",
		);
	});

	it("running node with ESM import throws migration error", async () => {
		await expect(
			exec(
				`node --input-type=module -e "import '${pathToFileURL(esmIndexPath).href}'"`,
			),
		).rejects.toMatchObject({
			stderr: expect.stringContaining(
				"You imported the 'arkenv' package as a library",
			),
		});
	});

	it("running node with CJS require throws migration error", async () => {
		await expect(
			exec(`node -e "require('${cjsIndexPath.replace(/\\/g, "\\\\")}')"`),
		).rejects.toMatchObject({
			stderr: expect.stringContaining(
				"You imported the 'arkenv' package as a library",
			),
		});
	});
});

describe("cli smoke tests", () => {
	it("--help prints usage and exits 0", async () => {
		const { stdout, stderr } = await exec(`node ${cliPath} --help`);
		expect(stdout).toContain("Usage:");
		expect(stdout).toContain("arkenv init");
		expect(stdout).toContain("arkenv check");
		expect(stdout).toContain("arkenv example");
		expect(stderr).toBe("");
	});

	it("-h prints usage and exits 0", async () => {
		const { stdout } = await exec(`node ${cliPath} -h`);
		expect(stdout).toContain("Usage:");
	});

	it("unknown command prints usage and exits 2", async () => {
		await expect(exec(`node ${cliPath} unknown`)).rejects.toMatchObject({
			code: 2,
			stdout: expect.stringContaining("Usage:"),
		});
	});

	it("running without arguments prints usage and exits 2", async () => {
		await expect(exec(`node ${cliPath}`)).rejects.toMatchObject({
			code: 2,
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
			const { stdout } = await exec(
				`node ${cliPath} init --agent --yes --force`,
				{
					env: {
						...process.env,
						INIT_CWD: tempDir,
						SKIP_INSTALL: "true",
					},
				},
			);

			const envelope = JSON.parse(stdout);
			expect(envelope).toMatchObject({
				ok: true,
				commandId: "init",
				exitCode: 0,
				diagnostics: [],
				nextActions: [],
			});

			const envFileExists = await fs
				.access(path.join(tempDir, "env.ts"))
				.then(() => true)
				.catch(() => false);
			expect(envFileExists).toBe(true);
		} finally {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});

	it("check --json emits structured missing schema error when no env.ts exists", async () => {
		const uuid = Math.random().toString(36).substring(7);
		const tempDir = path.resolve(__dirname, `../tmp-smoke-check-${uuid}`);
		await fs.mkdir(tempDir, { recursive: true });

		try {
			await expect(
				exec(`node ${cliPath} check --json`, {
					cwd: tempDir,
				}),
			).rejects.toMatchObject({
				code: 2,
				stdout: expect.stringContaining('"code": "CLI.SCHEMA_NOT_FOUND"'),
			});
		} finally {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});

	it("check --agent returns structured CLI.SCHEMA_NOT_FOUND error on missing schema", async () => {
		const uuid = Math.random().toString(36).substring(7);
		const tempDir = path.resolve(__dirname, `../tmp-smoke-check-${uuid}`);
		await fs.mkdir(tempDir, { recursive: true });

		try {
			const res = await exec(`node ${cliPath} check --agent`, {
				cwd: tempDir,
			}).catch((err) => err);

			expect(res.code).toBe(2);
			expect(res.stdout).toContain('"code": "CLI.SCHEMA_NOT_FOUND"');
		} finally {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});
});
