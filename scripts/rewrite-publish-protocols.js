#!/usr/bin/env node
/**
 * Rewrite `workspace:` / `catalog:` dependency specs to concrete versions
 * so `npm publish` (via Changesets) can ship valid package.json files
 * without a real pnpm CLI.
 *
 * Matches pnpm's publish rewrite for this repo:
 * - `workspace:*` → exact workspace package version (`1.0.0-rc.1`)
 * - `catalog:` → exact catalog pin (`2.7.0`)
 *
 * Used by `scripts/changeset-publish.js` during release only.
 */

import { globSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * @param {unknown} pkgJson
 * @returns {string[]}
 */
export function readWorkspacePackageGlobs(pkgJson) {
	const packages = pkgJson?.workspaces?.packages;
	if (!Array.isArray(packages) || packages.length === 0) {
		throw new Error(
			'package.json "workspaces.packages" must be a non-empty array (Nub SoT)',
		);
	}
	return packages;
}

/**
 * @param {unknown} pkgJson
 * @returns {Record<string, string>}
 */
export function readWorkspaceCatalog(pkgJson) {
	const catalog = pkgJson?.workspaces?.catalog;
	if (catalog == null) return {};
	if (typeof catalog !== "object" || Array.isArray(catalog)) {
		throw new Error(
			'package.json "workspaces.catalog" must be an object of name → version (Nub SoT)',
		);
	}
	/** @type {Record<string, string>} */
	const out = {};
	for (const [name, version] of Object.entries(catalog)) {
		if (typeof name !== "string" || name.trim() === "") {
			throw new Error(
				'package.json "workspaces.catalog" keys must be non-empty strings',
			);
		}
		if (typeof version !== "string" || version.trim() === "") {
			throw new Error(
				`package.json "workspaces.catalog[${JSON.stringify(name)}]" must be a non-empty string`,
			);
		}
		out[name] = version;
	}
	return out;
}

/**
 * @param {string} rootDir
 * @param {string[]} packageGlobs
 * @returns {Map<string, { dir: string, version: string, path: string }>}
 */
export function collectWorkspacePackages(rootDir, packageGlobs) {
	/** @type {Map<string, { dir: string, version: string, path: string }>} */
	const byName = new Map();
	for (const pattern of packageGlobs) {
		const matches = globSync(join(pattern, "package.json"), {
			cwd: rootDir,
		});
		for (const relativePath of matches) {
			const pkgPath = join(rootDir, relativePath);
			const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
			if (typeof pkg.name !== "string" || typeof pkg.version !== "string") {
				continue;
			}
			byName.set(pkg.name, {
				dir: dirname(pkgPath),
				version: pkg.version,
				path: pkgPath,
			});
		}
	}
	return byName;
}

/**
 * @param {string} packageName
 * @param {string} spec
 * @param {{ versions: Map<string, string>, catalog: Record<string, string> }} ctx
 * @returns {string}
 */
export function rewriteDependencySpec(packageName, spec, ctx) {
	if (typeof spec !== "string") return spec;

	if (spec === "workspace:*" || spec === "workspace:") {
		const version = ctx.versions.get(packageName);
		if (!version) {
			throw new Error(
				`Cannot rewrite ${JSON.stringify(spec)} for ${packageName}: not a workspace package`,
			);
		}
		return version;
	}

	if (spec.startsWith("workspace:")) {
		const rest = spec.slice("workspace:".length);
		// pnpm bare shorthand: workspace:^ / workspace:~ → ^<ver> / ~<ver>
		if (rest === "^" || rest === "~") {
			const version = ctx.versions.get(packageName);
			if (!version) {
				throw new Error(
					`Cannot rewrite ${JSON.stringify(spec)} for ${packageName}: not a workspace package`,
				);
			}
			return `${rest}${version}`;
		}
		// Explicit range already usable on the registry (workspace:^1.2.3, etc.).
		if (
			rest.startsWith("^") ||
			rest.startsWith("~") ||
			rest.startsWith(">") ||
			rest.startsWith("<") ||
			rest.startsWith("=") ||
			/^\d/.test(rest)
		) {
			return rest;
		}
		const version = ctx.versions.get(packageName);
		if (!version) {
			throw new Error(
				`Cannot rewrite ${JSON.stringify(spec)} for ${packageName}: not a workspace package`,
			);
		}
		return version;
	}

	if (spec === "catalog:" || spec === "catalog") {
		const version = ctx.catalog[packageName];
		if (!version) {
			throw new Error(
				`Cannot rewrite catalog: for ${packageName}: missing from workspaces.catalog`,
			);
		}
		return version;
	}

	if (spec.startsWith("catalog:")) {
		const entry = spec.slice("catalog:".length) || packageName;
		const version = ctx.catalog[entry] ?? ctx.catalog[packageName];
		if (!version) {
			throw new Error(
				`Cannot rewrite ${JSON.stringify(spec)} for ${packageName}: missing from workspaces.catalog`,
			);
		}
		return version;
	}

	return spec;
}

const DEP_FIELDS = [
	"dependencies",
	"devDependencies",
	"peerDependencies",
	"optionalDependencies",
];

/**
 * @param {Record<string, unknown>} pkg
 * @param {{ versions: Map<string, string>, catalog: Record<string, string> }} ctx
 * @returns {{ pkg: Record<string, unknown>, changed: boolean }}
 */
export function rewritePackageJsonProtocols(pkg, ctx) {
	let changed = false;
	const next = { ...pkg };

	for (const field of DEP_FIELDS) {
		const deps = pkg[field];
		if (!deps || typeof deps !== "object" || Array.isArray(deps)) continue;
		/** @type {Record<string, string>} */
		const rewritten = {};
		for (const [name, spec] of Object.entries(deps)) {
			const out = rewriteDependencySpec(name, spec, ctx);
			rewritten[name] = out;
			if (out !== spec) changed = true;
		}
		next[field] = rewritten;
	}

	return { pkg: next, changed };
}

/**
 * Rewrite every workspace package.json in place.
 *
 * @param {string} rootDir
 * @returns {{ path: string, original: string }[]} Snapshots for restore
 */
export function rewriteWorkspacePackageJsons(rootDir) {
	const rootPkg = JSON.parse(
		readFileSync(join(rootDir, "package.json"), "utf8"),
	);
	const globs = readWorkspacePackageGlobs(rootPkg);
	const catalog = readWorkspaceCatalog(rootPkg);
	const workspacePkgs = collectWorkspacePackages(rootDir, globs);
	/** @type {Map<string, string>} */
	const versions = new Map();
	for (const [name, info] of workspacePkgs) {
		versions.set(name, info.version);
	}
	const ctx = { versions, catalog };

	/** @type {{ path: string, original: string }[]} */
	const snapshots = [];
	for (const info of workspacePkgs.values()) {
		const original = readFileSync(info.path, "utf8");
		const parsed = JSON.parse(original);
		const { pkg, changed } = rewritePackageJsonProtocols(parsed, ctx);
		if (!changed) continue;
		snapshots.push({ path: info.path, original });
		const trailingNewline = original.endsWith("\n") ? "\n" : "";
		writeFileSync(
			info.path,
			`${JSON.stringify(pkg, null, "\t")}${trailingNewline}`,
		);
	}
	return snapshots;
}

/**
 * @param {{ path: string, original: string }[]} snapshots
 */
export function restorePackageJsonSnapshots(snapshots) {
	for (const { path, original } of snapshots) {
		writeFileSync(path, original);
	}
}
