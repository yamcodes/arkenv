#!/usr/bin/env node
/**
 * Publish unpublished workspace packages without a real pnpm CLI.
 *
 * Changesets detects `pnpm` whenever `pnpm-workspace.yaml` exists (our
 * manypkg discovery shim), then shells out to `pnpm publish` for
 * `workspace:` / `catalog:` rewrite. With `packageManager: nub@…` and no
 * lockfile pin, setup-nub's PATH shim bootstraps a broken `pnpm@latest`
 * stub (SyntaxError) — the Release failure on v1.
 *
 * This script:
 * 1. Rewrites `workspace:` / `catalog:` to concrete versions in package.json
 * 2. Temporarily forces Changesets onto the npm publish tool (stub
 *    package-lock.json + array-form workspaces; hide the pnpm shim)
 * 3. Runs `changeset publish` (git tags + CHANGESETS_OUTPUT for
 *    changesets/action)
 * 4. Restores the working tree
 *
 * Usage (via package.json `release`):
 *   node scripts/changeset-publish.js
 *   node scripts/changeset-publish.js --otp 123456
 */

import { spawnSync } from "node:child_process";
import {
	existsSync,
	readFileSync,
	renameSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
	restorePackageJsonSnapshots,
	rewriteWorkspacePackageJsons,
} from "./rewrite-publish-protocols.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const YAML_NAME = "pnpm-workspace.yaml";
const YAML_BAK = "pnpm-workspace.yaml.nub-publish-bak";
const LOCK_NAME = "package-lock.json";

/**
 * @param {string} rootDir
 * @returns {() => void}
 */
function forceNpmPublishTool(rootDir) {
	/** @type {(() => void)[]} */
	const restorers = [];

	const yamlPath = join(rootDir, YAML_NAME);
	const yamlBak = join(rootDir, YAML_BAK);
	if (existsSync(yamlPath)) {
		if (existsSync(yamlBak)) {
			unlinkSync(yamlBak);
		}
		renameSync(yamlPath, yamlBak);
		restorers.push(() => {
			if (existsSync(yamlBak)) {
				renameSync(yamlBak, yamlPath);
			}
		});
	}

	const lockPath = join(rootDir, LOCK_NAME);
	const createdLock = !existsSync(lockPath);
	if (createdLock) {
		writeFileSync(
			lockPath,
			`${JSON.stringify(
				{
					name: "arkenv-monorepo",
					lockfileVersion: 3,
					requires: true,
					packages: { "": {} },
				},
				null,
				"\t",
			)}\n`,
		);
		restorers.push(() => {
			if (existsSync(lockPath)) unlinkSync(lockPath);
		});
	}

	// @manypkg NpmTool only accepts Array.isArray(workspaces), not Nub's
	// `{ packages, catalog }` object form.
	const rootPkgPath = join(rootDir, "package.json");
	const rootOriginal = readFileSync(rootPkgPath, "utf8");
	const rootPkg = JSON.parse(rootOriginal);
	const packages = rootPkg.workspaces?.packages;
	if (!Array.isArray(packages) || packages.length === 0) {
		throw new Error(
			'package.json "workspaces.packages" must be a non-empty array (Nub SoT)',
		);
	}
	rootPkg.workspaces = packages;
	const trailingNewline = rootOriginal.endsWith("\n") ? "\n" : "";
	writeFileSync(
		rootPkgPath,
		`${JSON.stringify(rootPkg, null, "\t")}${trailingNewline}`,
	);
	restorers.push(() => writeFileSync(rootPkgPath, rootOriginal));

	return () => {
		for (const restore of restorers.reverse()) {
			restore();
		}
	};
}

/**
 * @param {string} rootDir
 * @param {string[]} publishArgs
 * @returns {number}
 */
export function runChangesetPublish(rootDir, publishArgs = []) {
	/** @type {{ path: string, original: string }[]} */
	let snapshots = [];
	/** @type {(() => void) | null} */
	let restoreNpmTool = null;
	try {
		snapshots = rewriteWorkspacePackageJsons(rootDir);
		restoreNpmTool = forceNpmPublishTool(rootDir);

		const bin = require.resolve("@changesets/cli/bin.js", {
			paths: [rootDir, __dirname],
		});
		const result = spawnSync(
			process.execPath,
			[bin, "publish", ...publishArgs],
			{
				cwd: rootDir,
				env: process.env,
				stdio: "inherit",
			},
		);
		if (result.error) throw result.error;
		return result.status ?? 1;
	} finally {
		try {
			restoreNpmTool?.();
		} catch (err) {
			console.error(
				"Failed to restore npm-tool publish shim:",
				err instanceof Error ? err.message : err,
			);
		}
		try {
			restorePackageJsonSnapshots(snapshots);
		} catch (err) {
			console.error(
				"Failed to restore package.json protocol rewrite:",
				err instanceof Error ? err.message : err,
			);
		}
	}
}

const isMain =
	Boolean(process.argv[1]) &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
	try {
		const code = runChangesetPublish(process.cwd(), process.argv.slice(2));
		process.exit(code);
	} catch (err) {
		console.error(err instanceof Error ? err.message : err);
		process.exit(1);
	}
}
