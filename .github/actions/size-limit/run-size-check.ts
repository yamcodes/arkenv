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

// Install dependencies and build before running size checks
// For regular PRs: getBaselineSizes already installed/built on base branch,
// so we need to reinstall/rebuild for current branch
// For release PRs: we never installed/built, so we need to do it now
if (isPR) {
	if (isReleasePR) {
		// Release PRs: install and build for the first time
		console.log("📦 Installing dependencies for release PR...");
		const installProc = spawn(["pnpm", "install"], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const installExitCode = await installProc.exited;
		if (installExitCode !== 0) {
			console.error("❌ Failed to install dependencies");
			process.exit(1);
		}

		console.log("🔨 Building project for release PR...");
		const buildProc = spawn(["pnpm", "run", "build", "--filter", filter], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const buildExitCode = await buildProc.exited;
		if (buildExitCode !== 0) {
			console.error("❌ Failed to build project");
			process.exit(1);
		}
	} else {
		// Regular PRs: reinstall and rebuild after baseline check
		// (getBaselineSizes checks out base branch and overwrites node_modules)
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

		console.log("🔨 Rebuilding project for current branch...");
		const rebuildProc = spawn(["pnpm", "run", "build", "--filter", filter], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const rebuildExitCode = await rebuildProc.exited;
		if (rebuildExitCode !== 0) {
			console.error(
				"❌ Failed to rebuild project, size check may be inaccurate",
			);
			process.exit(1);
		}
	}
}

// Run size-limit on current branch
const { results, hasErrors } = await runSizeLimit(filter);

// Log baseline and current sizes for debugging (especially for release PRs)
if (isReleasePR && baselineSizes.size > 0) {
	console.log("\n📊 Baseline sizes from npm:");
	for (const [key, size] of baselineSizes.entries()) {
		console.log(`  - ${key}: ${size} bytes`);
	}
	console.log("\n📊 Current sizes from size-limit:");
	for (const result of results) {
		const currentSizeBytes = parseSizeToBytes(result.size);
		console.log(
			`  - ${result.package}:${result.file}: ${currentSizeBytes} bytes (${result.size})`,
		);
	}
	console.log("");
}

// Calculate diffs and add to results
for (const result of results) {
	const key = `${result.package}:${result.file}`;
	const currentSizeBytes = parseSizeToBytes(result.size);
	let baselineSize = baselineSizes.get(key);
	let matchedKey = key;

	// If not found, try alternative key formats (for backwards compatibility)
	// e.g., if current has "index.js" but baseline has "bundle", or vice versa
	if (baselineSize === undefined && baselineSizes.size > 0) {
		// Try with "bundle" as fallback filename (for old baselines that used "bundle")
		const bundleKey = `${result.package}:bundle`;
		baselineSize = baselineSizes.get(bundleKey);
		if (baselineSize !== undefined) {
			matchedKey = bundleKey;
		}

		// If still not found, try to find any file for this package
		// This handles cases where filename format changed between baseline and current
		if (baselineSize === undefined) {
			for (const [baselineKey, size] of baselineSizes.entries()) {
				if (baselineKey.startsWith(`${result.package}:`)) {
					baselineSize = size;
					matchedKey = baselineKey;
					break;
				}
			}
		}
	}

	if (baselineSize !== undefined) {
		const diff = calculateDiff(currentSizeBytes, baselineSize);
		result.diff = diff;

		// Log detailed diff calculation for release PRs
		if (isReleasePR) {
			console.log(`🔍 Diff calculation for ${key}:`);
			console.log(`  - Baseline (${matchedKey}): ${baselineSize} bytes`);
			console.log(`  - Current (${key}): ${currentSizeBytes} bytes`);
			console.log(`  - Difference: ${currentSizeBytes - baselineSize} bytes`);
			console.log(`  - Percentage: ${diff}`);
		}
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
