import { exec as execCallback } from "node:child_process";
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

	it("unknown command prints usage and exits 0", async () => {
		const { stdout } = await exec(`node ${cliPath} unknown`);
		expect(stdout).toContain("Usage:");
	});

	it("running without arguments prints usage and exits 0", async () => {
		const { stdout } = await exec(`node ${cliPath}`);
		expect(stdout).toContain("Usage:");
	});
});
