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

import { execSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { argv, cwd } from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const PLAYGROUNDS_DIR = join(ROOT_DIR, "apps", "playgrounds");
const EXAMPLES_DIR = join(ROOT_DIR, "examples");

// Default files/directories to exclude from sync
const DEFAULT_EXCLUDES = [
	".cursor",
	"node_modules",
	"dist",
	".turbo",
	".pnpm-debug.log",
	"pnpm-lock.yaml", // Examples use npm/bun lockfiles instead
	"eslint.config.js", // Monorepo uses biome, examples don't need eslint
];

/**
 * Parse the pnpm-workspace.yaml catalog section to get versions
 */
function parseCatalog() {
	const workspaceYaml = readFileSync(
		join(ROOT_DIR, "pnpm-workspace.yaml"),
		"utf-8",
	);

	const catalog = {};
	let inCatalog = false;

	for (const line of workspaceYaml.split("\n")) {
		if (line.trim() === "catalog:") {
			inCatalog = true;
			continue;
		}

		if (inCatalog) {
			// Check if we've exited the catalog section (non-indented line that's not empty)
			if (line.trim() && !line.startsWith("  ") && !line.startsWith("\t")) {
				break;
			}

			const match = line.match(
				/^\s+["']?([^"':]+)["']?:\s*["']?([^"'\s]+)["']?/,
			);
			if (match) {
				catalog[match[1]] = match[2];
			}
		}
	}

	return catalog;
}

/**
 * Get the published version of a workspace package
 */
function getWorkspacePackageVersion(packageName) {
	// Map package names to their directories
	const packageDirs = {
		arkenv: join(ROOT_DIR, "packages", "arkenv"),
		"@arkenv/vite-plugin": join(ROOT_DIR, "packages", "vite-plugin"),
		"@arkenv/bun-plugin": join(ROOT_DIR, "packages", "bun-plugin"),
	};

	const packageDir = packageDirs[packageName];
	if (!packageDir || !existsSync(join(packageDir, "package.json"))) {
		console.warn(`Warning: Could not find package ${packageName}`);
		return null;
	}

	const pkg = JSON.parse(
		readFileSync(join(packageDir, "package.json"), "utf-8"),
	);
	return pkg.version;
}

/**
 * Transform dependencies from workspace/catalog format to published versions
 */
function transformDependencies(deps, catalog) {
	if (!deps) return deps;

	const transformed = {};

	for (const [name, version] of Object.entries(deps)) {
		if (version === "workspace:*" || version.startsWith("workspace:")) {
			const publishedVersion = getWorkspacePackageVersion(name);
			if (publishedVersion) {
				transformed[name] = `^${publishedVersion}`;
			} else {
				// Keep as-is if we can't find the version
				transformed[name] = version;
			}
		} else if (version === "catalog:" || version.startsWith("catalog:")) {
			const catalogVersion = catalog[name];
			if (catalogVersion) {
				transformed[name] = `^${catalogVersion}`;
			} else {
				// Keep as-is if not in catalog
				transformed[name] = version;
			}
		} else {
			transformed[name] = version;
		}
	}

	return transformed;
}

/**
 * Transform package.json for examples
 */
function transformPackageJson(pkg, exampleConfig, catalog) {
	const transformed = { ...pkg };

	// Update name if specified in config
	if (exampleConfig.name) {
		transformed.name = `arkenv-example-${exampleConfig.name}`;
	}

	// Transform dependencies
	transformed.dependencies = transformDependencies(pkg.dependencies, catalog);
	transformed.devDependencies = transformDependencies(
		pkg.devDependencies,
		catalog,
	);
	transformed.peerDependencies = transformDependencies(
		pkg.peerDependencies,
		catalog,
	);

	// Remove pnpm-specific fields that don't apply to standalone examples
	// biome-ignore lint/performance/noDelete: we need to remove the key
	delete transformed.arkenvExamples;

	// Update package manager if specified
	if (exampleConfig.packageManager) {
		// Get latest stable version for each package manager
		const packageManagers = {
			npm: "npm@11.6.4",
			pnpm: "pnpm@10.23.0",
		};

		if (catalog[exampleConfig.packageManager]) {
			transformed.packageManager = `${exampleConfig.packageManager}@${catalog[exampleConfig.packageManager]}`;
		} else {
			transformed.packageManager =
				packageManagers[exampleConfig.packageManager] ||
				exampleConfig.packageManager;
		}
	}

	// Remove workspace-specific scripts (like pnpm -w run fix)
	if (transformed.scripts) {
		for (const [scriptName, scriptCmd] of Object.entries(transformed.scripts)) {
			if (typeof scriptCmd === "string" && scriptCmd.includes("pnpm -w")) {
				// biome-ignore lint/performance/noDelete: we need to remove the key
				delete transformed.scripts[scriptName];
			}
		}
	}

	return transformed;
}

/**
 * Check if a path should be excluded
 */
function shouldExclude(name, excludes) {
	return excludes.some((pattern) => {
		if (pattern.includes("*")) {
			// Simple glob matching
			const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
			return regex.test(name);
		}
		return name === pattern;
	});
}

/**
 * Copy directory recursively with exclusions
 */
function copyDirectory(src, dest, excludes) {
	if (!existsSync(dest)) {
		mkdirSync(dest, { recursive: true });
	}

	const entries = readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		if (shouldExclude(entry.name, excludes)) {
			continue;
		}

		const srcPath = join(src, entry.name);
		const destPath = join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDirectory(srcPath, destPath, excludes);
		} else {
			cpSync(srcPath, destPath);
		}
	}
}

/**
 * Get all files in a directory recursively
 */
function getAllFiles(dir, excludes = [], basePath = dir) {
	const files = [];

	if (!existsSync(dir)) return files;

	const entries = readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		if (shouldExclude(entry.name, excludes)) {
			continue;
		}

		const fullPath = join(dir, entry.name);

		if (entry.isDirectory()) {
			files.push(...getAllFiles(fullPath, excludes, basePath));
		} else {
			files.push(relative(basePath, fullPath));
		}
	}

	return files;
}

/**
 * Compare two files and return if they're identical
 */
function filesAreIdentical(file1, file2) {
	if (!existsSync(file1) || !existsSync(file2)) {
		return false;
	}

	const content1 = readFileSync(file1);
	const content2 = readFileSync(file2);

	return content1.equals(content2);
}

/**
 * Sync a single playground to its example
 */
function syncPlayground(
	playgroundPath,
	exampleConfig,
	catalog,
	checkOnly = false,
) {
	const examplePath = join(EXAMPLES_DIR, exampleConfig.name);
	const playgroundName = basename(playgroundPath);
	const excludes = [...DEFAULT_EXCLUDES, ...(exampleConfig.exclude || [])];

	console.log(`\nSyncing ${playgroundName} → ${exampleConfig.name}`);

	// Track changes for check mode
	const changes = [];

	if (checkOnly) {
		// Compare files
		const playgroundFiles = getAllFiles(playgroundPath, excludes);
		const exampleFiles = existsSync(examplePath)
			? getAllFiles(examplePath, ["node_modules", "dist", ".turbo"])
			: [];

		// Check for missing files in example
		for (const file of playgroundFiles) {
			const srcFile = join(playgroundPath, file);
			const destFile = join(examplePath, file);

			if (file === "package.json") {
				// Special handling for package.json
				const srcPkg = JSON.parse(readFileSync(srcFile, "utf-8"));
				const transformedPkg = transformPackageJson(
					srcPkg,
					exampleConfig,
					catalog,
				);
				const transformedContent = `${JSON.stringify(transformedPkg, null, "\t")}\n`;

				if (!existsSync(destFile)) {
					changes.push(`Missing: ${file}`);
				} else {
					const destContent = readFileSync(destFile, "utf-8");
					if (destContent !== transformedContent) {
						changes.push(`Modified: ${file}`);
					}
				}
			} else {
				if (!existsSync(destFile)) {
					changes.push(`Missing: ${file}`);
				} else if (!filesAreIdentical(srcFile, destFile)) {
					changes.push(`Modified: ${file}`);
				}
			}
		}

		// Check for extra files in example (that shouldn't be there)
		for (const file of exampleFiles) {
			if (
				!playgroundFiles.includes(file) &&
				!shouldExclude(basename(file), excludes)
			) {
				// Check if this file is specific to the example (like .gitignore, lockfiles)
				const exampleSpecificFiles = [
					".gitignore",
					"bun.lock",
					"package-lock.json",
				];
				if (!exampleSpecificFiles.includes(file)) {
					changes.push(`Extra: ${file}`);
				}
			}
		}

		return changes;
	}

	// Actually sync files

	// Create or clean example directory
	if (existsSync(examplePath)) {
		// Remove existing files except for example-specific files
		const exampleSpecificFiles = [
			".gitignore",
			"bun.lock",
			"package-lock.json",
		];
		const entries = readdirSync(examplePath, { withFileTypes: true });

		for (const entry of entries) {
			if (
				!exampleSpecificFiles.includes(entry.name) &&
				entry.name !== "node_modules"
			) {
				const fullPath = join(examplePath, entry.name);
				rmSync(fullPath, { recursive: true, force: true });
			}
		}
	} else {
		mkdirSync(examplePath, { recursive: true });
	}

	// Copy files
	copyDirectory(playgroundPath, examplePath, excludes);

	// Transform package.json
	const pkgPath = join(examplePath, "package.json");
	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
	const transformedPkg = transformPackageJson(pkg, exampleConfig, catalog);
	writeFileSync(pkgPath, `${JSON.stringify(transformedPkg, null, "\t")}\n`);

	// Create .gitignore if it doesn't exist
	const gitignorePath = join(examplePath, ".gitignore");
	if (!existsSync(gitignorePath)) {
		writeFileSync(gitignorePath, ".env\n");
	}

	console.log(`  ✓ Synced to examples/${exampleConfig.name}`);

	return [];
}

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
