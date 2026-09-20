import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const wrapper = join(
	dirname(fileURLToPath(import.meta.url)),
	"vercel-wrapper.cjs",
);

/**
 * Run vercel-wrapper with a fake `vercel` binary on PATH.
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
			PATH: `${dir}:${process.env.PATH}`,
			GITHUB_STEP_SUMMARY: summaryPath,
			...options.env,
		},
	});
	return { result, summaryPath };
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
		const script = `
set -o pipefail
GIT_COMMIT_MESSAGE=$'Deploy www\\n\\nCo-authored-by: someone <dev@example.com>'
SHORT_MSG="\${GIT_COMMIT_MESSAGE%%$'\\n'*}"
printf '%s' "$SHORT_MSG"
`;
		const result = spawnSync("bash", ["-c", script], { encoding: "utf8" });
		expect(result.status).toBe(0);
		expect(result.stdout).toBe("Deploy www");
	});
});
