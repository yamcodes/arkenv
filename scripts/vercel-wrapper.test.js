import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const wrapper = join(repoRoot, "scripts", "vercel-wrapper.cjs");

const SHORT_MSG_WORKFLOWS = [
	".github/workflows/deploy-www.yml",
	".github/workflows/preview-www-reusable.yml",
];

/**
 * Run vercel-wrapper with a fake CLI via VERCEL_WRAPPER_BIN (nubx would ignore PATH).
 *
 * @param options Exit code, stderr, and extra env for the fake CLI
 */
function runWrapper(options) {
	const dir = mkdtempSync(join(tmpdir(), "vercel-wrapper-"));
	const fakeBin = join(dir, "vercel");
	writeFileSync(
		fakeBin,
		`#!/usr/bin/env node
process.stderr.write(${JSON.stringify(options.stderr ?? "")});
process.exit(${options.exitCode});
`,
		{ mode: 0o755 },
	);
	const summaryPath = join(dir, "summary.md");
	const result = spawnSync(process.execPath, [wrapper, "deploy"], {
		encoding: "utf8",
		env: {
			...process.env,
			VERCEL_WRAPPER_BIN: fakeBin,
			GITHUB_STEP_SUMMARY: summaryPath,
			...options.env,
		},
	});
	return { result, summaryPath };
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
});
