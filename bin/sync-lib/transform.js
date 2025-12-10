import { getWorkspacePackageVersion } from "./workspace.js";

/**
 * Transform dependencies from workspace/catalog format to published versions
 */
export function transformDependencies(deps, catalog) {
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
export function transformPackageJson(pkg, exampleConfig, catalog) {
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
