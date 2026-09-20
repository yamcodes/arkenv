import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT_DIR } from "./constants.js";

const publishedTagCache = new Map();

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
		"@arkenv/core": join(ROOT_DIR, "packages", "core"),
		"@arkenv/standard": join(ROOT_DIR, "packages", "standard"),
		"@arkenv/vite-plugin": join(ROOT_DIR, "packages", "vite-plugin"),
		"@arkenv/bun-plugin": join(ROOT_DIR, "packages", "bun-plugin"),
		"@arkenv/nextjs": join(ROOT_DIR, "packages", "nextjs"),
		"@arkenv/nuxt": join(ROOT_DIR, "packages", "nuxt"),
		"@arkenv/rsbuild-plugin": join(ROOT_DIR, "packages", "rsbuild-plugin"),
		"@arkenv/build": join(ROOT_DIR, "packages", "build"),
		arkenv: join(ROOT_DIR, "packages", "arkenv"),
		"@arkenv/fumadocs-ui": join(ROOT_DIR, "packages", "fumadocs-ui"),
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
 * Resolve the version currently published to an npm dist-tag.
 *
 * Examples are standalone npm projects, so they must pin a version that
 * exists on the registry. Workspace prereleases (for example `1.0.0-rc.0`
 * after a numbering reset) may not.
 *
 * @param packageName Package to look up
 * @param tag Dist-tag such as `rc`, `alpha`, or `beta`
 * @returns Published version, or `null` when the lookup fails
 */
export function lookupPublishedNpmVersion(packageName, tag) {
	const key = `${packageName}@${tag}`;
	if (publishedTagCache.has(key)) {
		return publishedTagCache.get(key);
	}

	try {
		const version = execFileSync(
			"npm",
			["view", packageName, "version", `--tag=${tag}`],
			{
				encoding: "utf8",
				stdio: ["ignore", "pipe", "pipe"],
			},
		).trim();
		const resolved = version || null;
		publishedTagCache.set(key, resolved);
		return resolved;
	} catch (error) {
		console.warn(
			`Warning: Could not look up ${packageName}@${tag}: ${error.message}`,
		);
		publishedTagCache.set(key, null);
		return null;
	}
}
