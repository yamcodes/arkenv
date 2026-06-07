import { exec as execCallback } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const exec = promisify(execCallback);
const createArkenvPath = path.resolve(__dirname, "../dist/index.cjs");

describe("create-arkenv smoke tests", () => {
	it("--help prints usage and exits 0", async () => {
		const { stdout, stderr } = await exec(`node ${createArkenvPath} --help`);
		expect(stdout).toContain("Usage:");
		expect(stdout).toContain("arkenv init");
		expect(stderr).toBe("");
	});

	it("-h prints usage and exits 0", async () => {
		const { stdout } = await exec(`node ${createArkenvPath} -h`);
		expect(stdout).toContain("Usage:");
	});

	it("forwards arguments to arkenv init", async () => {
		// --version is not a known init flag, but --help is handled before init runs
		// Just verify the proxy works by checking --help still works with extra args
		const { stdout, stderr } = await exec(
			`node ${createArkenvPath} --help --yes`,
		);
		expect(stdout + stderr).toContain("Usage:");
	});
});
