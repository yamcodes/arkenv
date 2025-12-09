#!/usr/bin/env node

/**
 * Sync examples from playgrounds.
 *
 * Playgrounds are the source of truth for examples. This script copies playground
 * files to the examples directory and transforms:
 * - `workspace:*` dependencies → `^<published-version>`
 * - `catalog:` dependencies → `^<catalog-version>`
 *
 * Usage:
 *   node bin/sync-examples.js           # Sync all examples
 *   node bin/sync-examples.js --check   # Check if examples are in sync (for CI)
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { argv } from "node:process";
import { PLAYGROUNDS_DIR } from "./sync-lib/constants.js";
import { syncPlayground } from "./sync-lib/sync.js";
import { parseCatalog } from "./sync-lib/workspace.js";

/**
 * Main function
 */
function main() {
	const checkOnly = argv.includes("--check");
	const catalog = parseCatalog();

	console.log(
		checkOnly
			? "Checking examples sync status..."
			: "Syncing examples from playgrounds...",
	);

	// Find all playgrounds with arkenvExamples metadata
	const playgroundDirs = readdirSync(PLAYGROUNDS_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => join(PLAYGROUNDS_DIR, d.name));

	let hasChanges = false;

	for (const playgroundPath of playgroundDirs) {
		const pkgPath = join(playgroundPath, "package.json");

		if (!existsSync(pkgPath)) {
			continue;
		}

		const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

		if (!pkg.arkenvExamples || !Array.isArray(pkg.arkenvExamples)) {
			continue;
		}

		for (const exampleConfig of pkg.arkenvExamples) {
			if (!exampleConfig.name) {
				console.warn(
					`Warning: Example config missing 'name' in ${basename(playgroundPath)}`,
				);
				continue;
			}

			const changes = syncPlayground(
				playgroundPath,
				exampleConfig,
				catalog,
				checkOnly,
			);

			if (checkOnly && changes.length > 0) {
				hasChanges = true;
				console.log(`\n  ✗ ${exampleConfig.name} is out of sync:`);
				for (const change of changes) {
					console.log(`    - ${change}`);
				}
			}
		}
	}

	if (checkOnly) {
		if (hasChanges) {
			console.log("\n❌ Examples are out of sync with playgrounds.");
			console.log("Run 'pnpm sync:examples' to update them.");
			process.exit(1);
		} else {
			console.log("\n✓ All examples are in sync with playgrounds.");
		}
	} else {
		console.log("\n✓ Examples synced successfully.");
	}
}

main();
