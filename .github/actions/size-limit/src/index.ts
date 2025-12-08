#!/usr/bin/env bun

import { installAndBuild } from "./build.ts";
import { getConfig } from "./config.ts";
import { getBaselineSizes } from "./git/baseline.ts";
import { getBaselineSizesFromNpm } from "./npm/baseline.ts";
import {
	createTable,
	handleNoPackagesChanged,
	setGitHubOutputs,
} from "./output.ts";
import { getChangedPackages } from "./package/changes.ts";
import {
	calculateDiffs,
	filterChangedPackages,
	logDebugInfo,
} from "./results.ts";
import { runSizeLimit } from "./size-limit/run.ts";
import type { SizeInBytes } from "./types.ts";

// Main execution
console.log("🔍 Running size-limit checks for all packages...");

const config = getConfig();

// Detect changed packages if in PR context
let changedPackages: Set<string> | null = null;
if (config.isPR && !config.isReleasePR) {
	const changeResult = await getChangedPackages(config.baseBranch);
	if (changeResult.success) {
		changedPackages = changeResult.packages;
		// Only exit early if we successfully detected that no packages changed
		if (changedPackages.size === 0) {
			await handleNoPackagesChanged();
		}
	} else {
		// Change detection failed - treat as "all packages changed" to ensure checks run
		// Setting changedPackages to null causes filterChangedPackages to return all results
		console.log(
			"⚠️ Change detection failed. Will check all packages to ensure no regressions slip through.",
		);
	}
}

// Get baseline sizes if in PR context
// For release PRs (changeset-release/main), compare against npm instead of base branch
const baselineSizes: Map<string, SizeInBytes> = config.isPR
	? config.isReleasePR
		? await getBaselineSizesFromNpm(
				config.filter,
				config.isPR,
				config.isReleasePR,
			)
		: await getBaselineSizes(config.baseBranch, config.filter, config.isPR)
	: new Map<string, SizeInBytes>();

// Install dependencies and build before running size checks
await installAndBuild(config, config.isReleasePR);

// Run size-limit on current branch
const { results, hasErrors } = await runSizeLimit(config.filter);

// Filter results to only include changed packages (if in PR context)
const filteredResults = filterChangedPackages(results, changedPackages);

// Log baseline and current sizes for debugging (especially for release PRs)
logDebugInfo(filteredResults, baselineSizes, config.isReleasePR);

// Calculate diffs and add to results
calculateDiffs(filteredResults, baselineSizes, config.isReleasePR);

// Create the table
const result = createTable(filteredResults);
console.log(result);
if (filteredResults.length === 0 && results.length > 0) {
	console.log("⚠️ Could not parse size-limit output");
}

// Set GitHub outputs
const packagesChanged = changedPackages === null || changedPackages.size > 0;
await setGitHubOutputs(result, hasErrors, packagesChanged);

// Print summary
if (hasErrors) {
	console.log("❌ Size limit checks failed");
	process.exit(1);
} else {
	console.log("✅ All size limit checks passed");
}
