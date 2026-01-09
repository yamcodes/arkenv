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

// Debug: Log results before filtering
console.log(`🔍 Found ${results.length} total results before filtering`);
console.log(
	`🔍 Changed packages: ${changedPackages ? Array.from(changedPackages).join(", ") || "(none)" : "(all)"}`,
);

// Filter results to only include changed packages (if in PR context)
const filteredResults = filterChangedPackages(results, changedPackages);

console.log(`🔍 ${filteredResults.length} results after filtering`);

// Log baseline and current sizes for debugging (especially for release PRs)
logDebugInfo(filteredResults, baselineSizes, config.isReleasePR);

// Calculate diffs and add to results
calculateDiffs(filteredResults, baselineSizes, config.isReleasePR);

// Create the table
const result = createTable(filteredResults);
console.log(result);

// Determine if we should fail and what errors to report
// The hasErrors flag from size-limit tells us if the command failed or limits were exceeded.
// But we need to decide:
// 1. Should we fail this workflow?
// 2. What error state should we report to GitHub (for PR comments, etc.)?
//
// Logic:
// - If we have filtered results AND size-limit reported errors, those errors are relevant (fail + report)
// - If results were filtered out, errors aren't relevant to this PR (pass + don't report)
// - If no results AND size-limit failed, this is a real failure (fail + report)
// - If no results AND size-limit succeeded, this is just a warning (pass + don't report)
let shouldFail = false;
let hasRelevantErrors = false;

if (filteredResults.length === 0) {
	if (results.length > 0) {
		// Results were filtered out - this means size-limit ran on packages,
		// but those packages were not in the changed packages set.
		// This is OK - don't fail the check, and don't report errors since they're not relevant.
		console.log(
			"ℹ️ Size checks ran but no results matched changed packages. This is expected when unchanged packages have size-limit configs.",
		);
		hasRelevantErrors = false;
		shouldFail = false;
	} else if (hasErrors) {
		// No results at all AND size-limit failed - this is a real failure
		console.log("⚠️ Could not parse size-limit output or size-limit failed");
		hasRelevantErrors = true;
		shouldFail = true;
	} else {
		// No results but size-limit succeeded - this could mean no packages have size-limit configs
		// This is OK - just a warning
		console.log("ℹ️ No size-limit results found. Packages may not have size-limit configured.");
		hasRelevantErrors = false;
		shouldFail = false;
	}
} else {
	// We have filtered results - check if any failed
	// Errors are relevant since they apply to the filtered results we're checking
	hasRelevantErrors = hasErrors;
	shouldFail = hasErrors;
}

// Set GitHub outputs
const packagesChanged = changedPackages === null || changedPackages.size > 0;
await setGitHubOutputs(result, hasRelevantErrors, packagesChanged);

// Print summary
if (shouldFail) {
	console.log("❌ Size limit checks failed");
	process.exit(1);
} else {
	console.log("✅ All size limit checks passed");
}
