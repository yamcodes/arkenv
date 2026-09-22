import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const wrapper = join(repoRoot, "scripts", "vercel-wrapper.cjs");
const require = createRequire(import.meta.url);
const {
	buildChildEnv,
	isBuildCommand,
	stripCorepackFromPulledEnv,
} = require("./vercel-wrapper.cjs");

const SHORT_MSG_WORKFLOWS = [
	".github/workflows/deploy-www.yml",
	".github/workflows/preview-www-reusable.yml",
];

/**
 * Run vercel-wrapper with a fake CLI via VERCEL_WRAPPER_BIN (nubx would ignore PATH).
 *
 * @param options Exit code, stderr, CLI args, cwd, and extra env for the fake CLI
 */
function runWrapper(options) {
	const dir = mkdtempSync(join(tmpdir(), "vercel-wrapper-"));
	const fakeBin = join(dir, "vercel");
	const echoEnv = options.echoEnv ?? false;
	writeFileSync(
		fakeBin,
		`#!/usr/bin/env node
${
	echoEnv
		? `process.stdout.write(JSON.stringify({
  ENABLE_EXPERIMENTAL_COREPACK: process.env.ENABLE_EXPERIMENTAL_COREPACK ?? null,
  VERCEL_INSTALL_COMPLETED: process.env.VERCEL_INSTALL_COMPLETED ?? null,
  VERCEL_INSTALL_COMPLETED_PATH: process.env.VERCEL_INSTALL_COMPLETED_PATH ?? null,
  argv: process.argv.slice(2),
}) + "\\n");`
		: ""
}
process.stderr.write(${JSON.stringify(options.stderr ?? "")});
process.exit(${options.exitCode ?? 0});
`,
		{ mode: 0o755 },
	);
	const summaryPath = join(dir, "summary.md");
	const cliArgs = options.args ?? ["deploy"];
	const result = spawnSync(process.execPath, [wrapper, ...cliArgs], {
		encoding: "utf8",
		cwd: options.cwd,
		env: {
			...process.env,
			VERCEL_WRAPPER_BIN: fakeBin,
			GITHUB_STEP_SUMMARY: summaryPath,
			...options.env,
		},
	});
	return { result, summaryPath, dir };
}

/**
 * Pull the SHORT_MSG assignment the workflow actually runs.
 *
 * @param yaml Workflow file contents
 * @param rel Path for assertion messages
 */
function shortMsgAssignment(yaml, rel) {
	const line = yaml
		.split("\n")
		.map((entry) => entry.trim())
		.find((entry) => entry.startsWith("SHORT_MSG="));
	expect(line, `${rel} must assign SHORT_MSG`).toBeTruthy();
	return line;
}

describe("vercel-wrapper", () => {
	it("emits a GitHub error annotation and step summary on failure", () => {
		const { result, summaryPath } = runWrapper({
			exitCode: 1,
			stderr: "RATE_LIMIT_EXCEEDED\nToo many requests",
		});

		expect(result.status).toBe(1);
		expect(result.stdout).toContain(
			"::error title=Vercel Rate Limit Exceeded::",
		);
		expect(result.stdout).toContain("%0A");
		expect(readFileSync(summaryPath, "utf8")).toContain(
			"Vercel rate limit exceeded",
		);
	});

	it("does not SIGPIPE when taking the first line of a multiline commit message", () => {
		for (const rel of SHORT_MSG_WORKFLOWS) {
			const yaml = readFileSync(join(repoRoot, rel), "utf8");
			const assignment = shortMsgAssignment(yaml, rel);
			expect(assignment, rel).not.toMatch(/\|\s*head\b/);

			const script = [
				"set -o pipefail",
				"GIT_COMMIT_MESSAGE=$'Deploy www\\n\\nCo-authored-by: someone <dev@example.com>'",
				assignment,
				"printf '%s' \"$SHORT_MSG\"",
			].join("\n");
			const result = spawnSync("bash", ["-c", script], { encoding: "utf8" });
			expect(result.status, rel).toBe(0);
			expect(result.stdout, rel).toBe("Deploy www");
		}
	});

	it("sanitizes Corepack and install env for build only", () => {
		const { result } = runWrapper({
			args: ["build", "--token=fake"],
			echoEnv: true,
			env: {
				ENABLE_EXPERIMENTAL_COREPACK: "1",
				VERCEL_INSTALL_COMPLETED_PATH: "/tmp/should-be-cleared",
			},
		});

		expect(result.status).toBe(0);
		const payload = JSON.parse(result.stdout.trim());
		expect(payload.ENABLE_EXPERIMENTAL_COREPACK).toBe("0");
		expect(payload.VERCEL_INSTALL_COMPLETED).toBe("1");
		expect(payload.VERCEL_INSTALL_COMPLETED_PATH).toBeNull();
		expect(payload.argv[0]).toBe("build");
	});

	it("leaves Corepack env untouched for non-build commands", () => {
		const { result } = runWrapper({
			args: ["deploy", "--prebuilt"],
			echoEnv: true,
			env: {
				ENABLE_EXPERIMENTAL_COREPACK: "1",
			},
		});

		expect(result.status).toBe(0);
		const payload = JSON.parse(result.stdout.trim());
		expect(payload.ENABLE_EXPERIMENTAL_COREPACK).toBe("1");
		expect(payload.VERCEL_INSTALL_COMPLETED).toBeNull();
	});

	it("strips ENABLE_EXPERIMENTAL_COREPACK from pulled .vercel env files on build", () => {
		const cwd = mkdtempSync(join(tmpdir(), "vercel-wrapper-cwd-"));
		const vercelDir = join(cwd, ".vercel");
		mkdirSync(vercelDir);
		const envFile = join(vercelDir, ".env.production.local");
		writeFileSync(
			envFile,
			[
				"ENABLE_EXPERIMENTAL_COREPACK=1",
				"SOME_OTHER=keep",
				'ENABLE_EXPERIMENTAL_COREPACK="1"',
			].join("\n"),
		);

		const { result } = runWrapper({
			args: ["build"],
			echoEnv: true,
			cwd,
			env: {
				ENABLE_EXPERIMENTAL_COREPACK: "1",
			},
		});

		expect(result.status).toBe(0);
		const payload = JSON.parse(result.stdout.trim());
		expect(payload.ENABLE_EXPERIMENTAL_COREPACK).toBe("0");
		expect(readFileSync(envFile, "utf8")).toBe("SOME_OTHER=keep");
	});

	it("buildChildEnv helpers match the build-only contract", () => {
		expect(isBuildCommand(["build", "--prod"])).toBe(true);
		expect(isBuildCommand(["deploy"])).toBe(false);

		const env = buildChildEnv(
			{
				ENABLE_EXPERIMENTAL_COREPACK: "1",
				VERCEL_INSTALL_COMPLETED_PATH: "/x",
				KEEP: "yes",
			},
			["build"],
			{ cwd: mkdtempSync(join(tmpdir(), "vercel-wrapper-helpers-")) },
		);
		expect(env.ENABLE_EXPERIMENTAL_COREPACK).toBe("0");
		expect(env.VERCEL_INSTALL_COMPLETED).toBe("1");
		expect(env.VERCEL_INSTALL_COMPLETED_PATH).toBeUndefined();
		expect(env.KEEP).toBe("yes");
	});

	it("stripCorepackFromPulledEnv removes the Corepack flag lines", () => {
		const cwd = mkdtempSync(join(tmpdir(), "vercel-wrapper-strip-"));
		const vercelDir = join(cwd, ".vercel");
		mkdirSync(vercelDir);
		const envFile = join(vercelDir, ".env.preview.local");
		writeFileSync(envFile, "FOO=1\nENABLE_EXPERIMENTAL_COREPACK=1\nBAR=2\n");
		stripCorepackFromPulledEnv(cwd);
		expect(readFileSync(envFile, "utf8")).toBe("FOO=1\nBAR=2\n");
	});
});
