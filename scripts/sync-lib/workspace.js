import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT_DIR } from "./constants.js";

/**
 * Parse the pnpm-workspace.yaml catalog section to get versions
 */
export function parseCatalog() {
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
export function getWorkspacePackageVersion(packageName) {
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
