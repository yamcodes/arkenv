import {
	getWorkspacePackageVersion,
	lookupPublishedNpmVersion,
} from "./workspace.js";

/**
 * Dist-tag channel encoded in a SemVer prerelease (`1.0.0-rc.0` → `rc`).
 *
 * @param version Workspace or catalog version
 * @returns Channel name, or `null` for a stable version
 */
export function prereleaseChannel(version) {
	const match = /^[0-9]+\.[0-9]+\.[0-9]+-([A-Za-z]+)/.exec(version);
	return match ? match[1].toLowerCase() : null;
}

/**
 * Pin a workspace package for a standalone example.
 *
 * Stable versions get a caret. Prereleases stay exact and, when the
 * workspace version is not on npm yet, use the last published dist-tag
 * for that channel (`@rc`, `@alpha`, `@beta`). Examples resolve published
 * packages, not unpublished in-repo staging numbers.
 *
 * @param packageName Workspace package name
 * @param workspaceVersion Version from the package's `package.json`
 * @param lookupPublished Dist-tag lookup (injectable in tests)
 */
export function exampleVersionSpec(
	packageName,
	workspaceVersion,
	lookupPublished = lookupPublishedNpmVersion,
) {
	const channel = prereleaseChannel(workspaceVersion);
	if (!channel) {
		return `^${workspaceVersion}`;
	}

	return lookupPublished(packageName, channel) ?? workspaceVersion;
}

/**
 * Transform dependencies from workspace/catalog format to published versions
 *
 * @param deps Dependency map from package.json
 * @param catalog Workspace catalog versions
 * @param options Optional version lookups for tests
 */
export function transformDependencies(deps, catalog, options = {}) {
	if (!deps) return deps;

	const getVersion =
		options.getWorkspacePackageVersion ?? getWorkspacePackageVersion;
	const lookupPublished = options.lookupPublished ?? lookupPublishedNpmVersion;

	const transformed = {};

	for (const [name, version] of Object.entries(deps)) {
		if (version === "workspace:*" || version.startsWith("workspace:")) {
			const publishedVersion = getVersion(name);
			if (publishedVersion) {
				transformed[name] = exampleVersionSpec(
					name,
					publishedVersion,
					lookupPublished,
				);
			} else {
				// Keep as-is if we can't find the version
				transformed[name] = version;
			}
		} else if (version === "catalog:" || version.startsWith("catalog:")) {
			const catalogVersion = catalog[name];
			if (catalogVersion) {
				const hasCaret = !catalogVersion.includes("-");
				transformed[name] = hasCaret ? `^${catalogVersion}` : catalogVersion;
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
 *
 * @param pkg Source playground package.json
 * @param exampleConfig Playground `arkenvExamples` entry
 * @param catalog Workspace catalog versions
 * @param options Optional version lookups for tests
 */
export function transformPackageJson(pkg, exampleConfig, catalog, options) {
	const transformed = { ...pkg };

	// Update name if specified in config
	if (exampleConfig.name) {
		transformed.name = `arkenv-example-${exampleConfig.name}`;
	}

	// Transform dependencies
	transformed.dependencies = transformDependencies(
		pkg.dependencies,
		catalog,
		options,
	);
	transformed.devDependencies = transformDependencies(
		pkg.devDependencies,
		catalog,
		options,
	);
	transformed.peerDependencies = transformDependencies(
		pkg.peerDependencies,
		catalog,
		options,
	);

	// Remove pnpm-specific fields that don't apply to standalone examples
	delete transformed.arkenvExamples;

	// Update package manager if specified (version from workspace catalog)
	if (exampleConfig.packageManager) {
		const pm = exampleConfig.packageManager;
		const version = catalog[pm];
		if (!version) {
			throw new Error(
				`Package manager "${pm}" not found in workspace catalog; add e.g. "${pm}: <version>"`,
			);
		}
		transformed.packageManager = `${pm}@${version}`;
	}

	// Remove workspace-specific scripts (like pnpm -w run fix)
	if (transformed.scripts) {
		for (const [scriptName, scriptCmd] of Object.entries(transformed.scripts)) {
			if (typeof scriptCmd === "string" && scriptCmd.includes("pnpm -w")) {
				delete transformed.scripts[scriptName];
			}
		}
		// Nuxt examples require 'postinstall': 'nuxt prepare' per official templates,
		// but we omit it in the monorepo playground to prevent CI/bootstrap cycles.
		if (exampleConfig.name === "with-nuxt") {
			transformed.scripts.postinstall = "nuxt prepare";
		}
	}

	return transformed;
}
