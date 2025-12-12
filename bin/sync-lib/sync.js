import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { DEFAULT_EXCLUDES, EXAMPLES_DIR } from "./constants.js";
import {
	copyDirectory,
	filesAreIdentical,
	getAllFiles,
	shouldExclude,
} from "./fs-utils.js";
import { transformPackageJson } from "./transform.js";

/**
 * Regenerate lock file based on package manager
 */
function regenerateLockFile(examplePath, packageManager) {
	if (!packageManager) {
		return;
	}

	console.log(`  ⟳ Regenerating lock file with ${packageManager}...`);

	let bin;
	let args;
	let lockFile;

	if (packageManager === "npm" || packageManager.startsWith("npm@")) {
		bin = "npm";
		args = ["install", "--package-lock-only", "--ignore-scripts"];
		lockFile = "package-lock.json";
	} else if (packageManager === "bun" || packageManager.startsWith("bun@")) {
		bin = "bun";
		// Added --lockfile-only for bun
		args = ["install", "--lockfile-only", "--ignore-scripts"];
		lockFile = "bun.lock";
	} else if (packageManager === "pnpm" || packageManager.startsWith("pnpm@")) {
		bin = "pnpm";
		args = [
			"install",
			"--lockfile-only",
			"--ignore-workspace",
			"--ignore-scripts",
		];
		lockFile = "pnpm-lock.yaml";
	} else {
		console.warn(`  ⚠ Unknown package manager: ${packageManager}`);
		return;
	}

	const lockFilePath = join(examplePath, lockFile);
	let backup = null;

	try {
		// Backup existing lockfile if it exists
		if (existsSync(lockFilePath)) {
			backup = readFileSync(lockFilePath);
		}

		// Run the lock file generation command
		execFileSync(bin, args, {
			cwd: examplePath,
			stdio: "pipe",
		});

		console.log(`  ✓ Generated ${lockFile}`);
	} catch (error) {
		console.warn(`  ⚠ Failed to regenerate lock file: ${error.message}`);

		// Restore backup if available and generation failed
		if (backup) {
			try {
				writeFileSync(lockFilePath, backup);
				console.log(`  ⟳ Restored backup of ${lockFile}`);
			} catch (restoreError) {
				console.warn(
					`  ⚠ Failed to restore backup of ${lockFile}: ${restoreError.message}`,
				);
			}
		}
	}
}

/**
 * Sync a single playground to its example
 */
export function syncPlayground(
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
			? getAllFiles(examplePath, excludes)
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
					"bun.lockb",
					"pnpm-lock.yaml",
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
			"bun.lockb",
			"pnpm-lock.yaml",
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

	// Regenerate lock file if package manager is specified
	if (transformedPkg.packageManager) {
		regenerateLockFile(examplePath, transformedPkg.packageManager);
	}

	// Create .gitignore if it doesn't exist
	const gitignorePath = join(examplePath, ".gitignore");
	if (!existsSync(gitignorePath)) {
		writeFileSync(gitignorePath, ".env\n");
	}

	console.log(`  ✓ Synced to examples/${exampleConfig.name}`);

	return [];
}
