import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Published optional peer range for `@arkenv/core` and `@arkenv/standard`. */
const CORE_PEER_RANGE = "^1.0.0-0";

const FRAMEWORK_PLUGINS = [
	"packages/nextjs",
	"packages/nuxt",
	"packages/vite-plugin",
	"packages/bun-plugin",
	"packages/rsbuild-plugin",
];

const CORE_PEERS = ["@arkenv/core", "@arkenv/standard"];

/**
 * Return npm package roots that might sit next to a Node or npm binary.
 *
 * @param {string} binPath Absolute path to `node` or `npm`
 * @returns {string[]}
 */
function npmPackageRootCandidates(binPath) {
	const real = realpathSync(binPath);
	const binDir = dirname(real);
	return [
		join(binDir, ".."),
		join(binDir, "lib", "node_modules", "npm"),
		join(binDir, "..", "lib", "node_modules", "npm"),
		join(binDir, "..", "node_modules", "npm"),
		join(binDir, "node_modules", "npm"),
	];
}

/**
 * Resolve an `npm` executable from `PATH`.
 *
 * @returns {string | undefined} Absolute path, or `undefined` when `npm` is absent
 */
function findNpmOnPath() {
	const command = process.platform === "win32" ? "where.exe" : "which";
	try {
		const output = execFileSync(command, ["npm"], { encoding: "utf8" });
		const first = output
			.trim()
			.split(/\r?\n/)
			.find((line) => line.trim() !== "");
		return first ? realpathSync(first.trim()) : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Load the `semver` package bundled with npm.
 *
 * Range checks stay aligned with the registry client without a workspace
 * dependency on `semver`.
 *
 * @returns {{ satisfies: (version: string, range: string) => boolean }}
 * @throws When npm's bundled `semver` cannot be found
 */
function loadNpmSemver() {
	const bins = [process.execPath];
	const npmBin = findNpmOnPath();
	if (npmBin) bins.push(npmBin);

	for (const bin of bins) {
		for (const root of npmPackageRootCandidates(bin)) {
			const pkgJson = join(root, "package.json");
			const semverEntry = join(root, "node_modules", "semver");
			if (!existsSync(pkgJson) || !existsSync(semverEntry)) continue;
			const pkg = JSON.parse(readFileSync(pkgJson, "utf8"));
			if (pkg.name !== "npm") continue;
			return createRequire(pkgJson)("semver");
		}
	}

	throw new Error("Could not locate the semver package bundled with npm");
}

/**
 * Read one framework plugin manifest.
 *
 * @param {string} packageDir Workspace path relative to the repo root
 * @returns {Record<string, any>}
 */
function readPluginManifest(packageDir) {
	return JSON.parse(
		readFileSync(join(rootDir, packageDir, "package.json"), "utf8"),
	);
}

describe("framework plugin core peers", () => {
	const semver = loadNpmSemver();

	it("publishes an optional ^1.0.0-0 peer for core and standard", () => {
		for (const packageDir of FRAMEWORK_PLUGINS) {
			const manifest = readPluginManifest(packageDir);
			for (const name of CORE_PEERS) {
				expect(manifest.peerDependencies[name], packageDir).toBe(
					CORE_PEER_RANGE,
				);
				expect(manifest.peerDependenciesMeta[name], packageDir).toEqual({
					optional: true,
				});
				expect(manifest.devDependencies[name], packageDir).toBe("workspace:*");
			}
		}
	});

	it("matches 1.0.0 prereleases and stable 1.x, and excludes 2.0.0", () => {
		const matches = ["1.0.0-alpha.2", "1.0.0-rc.4", "1.0.0", "1.0.1", "1.1.0"];
		const misses = ["2.0.0", "2.0.0-0", "1.1.0-rc.0"];

		for (const version of matches) {
			expect(semver.satisfies(version, CORE_PEER_RANGE), version).toBe(true);
		}
		for (const version of misses) {
			expect(semver.satisfies(version, CORE_PEER_RANGE), version).toBe(false);
		}
		expect(semver.satisfies("1.0.0-rc.4", "^1.0.0")).toBe(false);
	});
});
