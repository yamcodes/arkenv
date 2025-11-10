#!/usr/bin/env bun

import { spawn } from "bun";
import { getBaselineSizes } from "./lib/git.ts";
import { getBaselineSizesFromNpm } from "./lib/npm.ts";
import { runSizeLimit } from "./lib/size-limit.ts";
import type { SizeInBytes } from "./types.ts";
import { calculateDiff, parseSizeToBytes } from "./utils/size.ts";

// Get inputs from environment
const turboToken = process.env.INPUT_TURBO_TOKEN;
const turboTeam = process.env.INPUT_TURBO_TEAM;
const filter = process.env.INPUT_FILTER || "./packages/*";
const baseBranch = process.env.INPUT_BASE_BRANCH || "main";
const headBranch = process.env.INPUT_HEAD_BRANCH || "";
const isPR = process.env.GITHUB_EVENT_NAME === "pull_request";
const isReleasePR = headBranch === "changeset-release/main";

// Set Turbo environment variables if provided
if (turboToken) {
	process.env.TURBO_TOKEN = turboToken;
}
if (turboTeam) {
	process.env.TURBO_TEAM = turboTeam;
}

// Main execution
console.log("🔍 Running size-limit checks for all packages...");

// Get baseline sizes if in PR context
// For release PRs (changeset-release/main), compare against npm instead of base branch
const baselineSizes = isPR
	? isReleasePR
		? await getBaselineSizesFromNpm(filter, isPR, isReleasePR)
		: await getBaselineSizes(baseBranch, filter, isPR)
	: new Map<string, SizeInBytes>();

// Reinstall dependencies for current branch after baseline check
// (getBaselineSizes checks out base branch and overwrites node_modules)
// This is only needed when comparing against base branch, not npm
if (isPR && !isReleasePR) {
	console.log("📦 Reinstalling dependencies for current branch...");
	const reinstallProc = spawn(["pnpm", "install"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const reinstallExitCode = await reinstallProc.exited;
	if (reinstallExitCode !== 0) {
		console.log(
			"⚠️ Failed to reinstall dependencies, size check may be inaccurate",
		);
	}

	// Rebuild project to clear base branch artifacts before size check
	console.log("🔨 Rebuilding project for current branch...");
	const rebuildProc = spawn(["pnpm", "run", "build", "--filter", filter], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const rebuildExitCode = await rebuildProc.exited;
	if (rebuildExitCode !== 0) {
		console.error("❌ Failed to rebuild project, size check may be inaccurate");
		process.exit(1);
	}
}

// Run size-limit on current branch
const { results, hasErrors } = await runSizeLimit(filter);

// Calculate diffs and add to results
for (const result of results) {
	const key = `${result.package}:${result.file}`;
	let baselineSize = baselineSizes.get(key);

	// If not found, try alternative key formats (for backwards compatibility)
	// e.g., if current has "index.js" but baseline has "bundle", or vice versa
	if (baselineSize === undefined && baselineSizes.size > 0) {
		// Try with "bundle" as fallback filename (for old baselines that used "bundle")
		const bundleKey = `${result.package}:bundle`;
		baselineSize = baselineSizes.get(bundleKey);

		// If still not found, try to find any file for this package
		// This handles cases where filename format changed between baseline and current
		if (baselineSize === undefined) {
			for (const [baselineKey, size] of baselineSizes.entries()) {
				if (baselineKey.startsWith(`${result.package}:`)) {
					baselineSize = size;
					break;
				}
			}
		}
	}

	if (baselineSize !== undefined) {
		const currentSize = parseSizeToBytes(result.size);
		result.diff = calculateDiff(currentSize, baselineSize);
	} else {
		// Only log if there's an issue (can't compute diff)
		if (baselineSizes.size > 0) {
			const availableKeys = Array.from(baselineSizes.keys()).join(", ");
			console.log(
				`⚠️ No baseline found for ${key}. Available keys: ${availableKeys}`,
			);
		} else {
			console.log(
				`⚠️ No baseline found for ${key}. Baseline map is empty (size: ${baselineSizes.size}).`,
			);
		}
		result.diff = "—";
	}
}

// Create the table
let result: string;
if (results.length === 0) {
	result = "```\nNo results found\n```";
	console.log("⚠️ Could not parse size-limit output");
} else {
	const tableRows = results
		.map(
			(r) =>
				`| \`${r.package}\` | \`${r.file}\` | ${r.size} | ${r.limit} | ${r.diff ?? "—"} | ${r.status} |`,
		)
		.join("\n");
	result = `| Package | File | Size | Limit | Diff | Status |\n|---------|------|------|-------|------|--------|\n${tableRows}`;
}

// Set GitHub outputs
const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput) {
	const fs = await import("node:fs/promises");
	const output = `result<<EOF\n${result}\nEOF\nhas_errors=${hasErrors}\n`;
	await fs.appendFile(githubOutput, output);
}

// Print summary
if (hasErrors) {
	console.log("❌ Size limit checks failed");
	process.exit(1);
} else {
	console.log("✅ All size limit checks passed");
}
