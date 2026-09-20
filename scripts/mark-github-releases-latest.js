/**
 * Mark GitHub Releases for SemVer prereleases as the repo Latest.
 *
 * Context: `changesets/action` creates GitHub Releases with
 * `prerelease: version.includes("-")` and does not pass `make_latest`.
 * GitHub forbids the Latest badge on prereleases ("Drafts and
 * prereleases cannot be set as latest"), so RC/alpha releases never
 * become the Releases-page Latest unless we clear the GitHub
 * prerelease flag and set `make_latest: "true"`.
 *
 * Product decision (v1 RC window): the Releases UI should treat the
 * current RC as Latest. npm dist-tags are unchanged by this script.
 *
 * Gates:
 * - `.changeset/pre.json` has `"mode": "pre"` (any pre tag: rc, alpha, …).
 * - Caller supplies published packages (or `--from-workspace`).
 * - `GITHUB_TOKEN` with permission to update releases.
 *
 * Preference: only one release can be Latest. Prefer `arkenv`, then
 * `@arkenv/core`. Sibling pre releases get `prerelease: false` so they
 * lose the Pre-release badge, but `make_latest: "false"`.
 *
 * Usage:
 *   node scripts/mark-github-releases-latest.js --packages '[{"name":"arkenv","version":"1.0.0-rc.2"}]'
 *   node scripts/mark-github-releases-latest.js --from-workspace
 *   node scripts/mark-github-releases-latest.js --packages '…' --dry-run
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPreJson, parsePublishedPackages } from "./point-latest-at-rc.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultRootDir = join(__dirname, "..");

/** Preferred package names for the single repo Latest badge (first match wins). */
export const LATEST_PACKAGE_PREFERENCE = ["arkenv", "@arkenv/core"];

/**
 * @param {unknown} pre
 * @returns {boolean}
 */
export function shouldMarkGithubReleasesLatest(pre) {
	if (!pre || typeof pre !== "object") return false;
	const record = /** @type {{ mode?: unknown }} */ (pre);
	return record.mode === "pre";
}

/**
 * @param {unknown} pre
 * @returns {string}
 */
export function skipReasonForGithubLatest(pre) {
	if (pre == null) {
		return "Not in Changesets pre mode (.changeset/pre.json missing); skipping GitHub Latest mark";
	}
	const record = /** @type {{ mode?: unknown }} */ (pre);
	return `Changesets pre.json mode is ${JSON.stringify(record.mode)} (not "pre"); skipping GitHub Latest mark`;
}

/**
 * Changesets tags are `name@version` (including scoped names).
 * @param {string} name
 * @param {string} version
 * @returns {string}
 */
export function releaseTagName(name, version) {
	return `${name}@${version}`;
}

/**
 * @param {string} version
 * @returns {boolean}
 */
export function isSemverPrerelease(version) {
	return typeof version === "string" && version.includes("-");
}

/**
 * Pick which published package should receive `make_latest: "true"`.
 * @param {{ name: string; version: string }[]} packages
 * @returns {{ name: string; version: string } | null}
 */
export function pickLatestReleasePackage(packages) {
	const prereleases = packages.filter((pkg) => isSemverPrerelease(pkg.version));
	if (prereleases.length === 0) return null;
	for (const preferred of LATEST_PACKAGE_PREFERENCE) {
		const hit = prereleases.find((pkg) => pkg.name === preferred);
		if (hit) return hit;
	}
	return prereleases[0] ?? null;
}

/**
 * Read non-private workspace packages whose version is a SemVer prerelease.
 * @param {string} rootDir
 * @param {{ readdirSync?: typeof readdirSync; readFileSync?: typeof readFileSync; existsSync?: typeof existsSync }} [fs]
 * @returns {{ name: string; version: string }[]}
 */
export function listWorkspacePrereleasePackages(rootDir, fs = {}) {
	const readdir = fs.readdirSync ?? readdirSync;
	const read = fs.readFileSync ?? readFileSync;
	const exists = fs.existsSync ?? existsSync;
	const packagesDir = join(rootDir, "packages");
	if (!exists(packagesDir)) return [];

	/** @type {{ name: string; version: string }[]} */
	const packages = [];
	for (const entry of readdir(packagesDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const pkgPath = join(packagesDir, entry.name, "package.json");
		if (!exists(pkgPath)) continue;
		const pkg = JSON.parse(read(pkgPath, "utf8"));
		if (
			pkg.private ||
			typeof pkg.name !== "string" ||
			!pkg.name ||
			typeof pkg.version !== "string" ||
			!isSemverPrerelease(pkg.version)
		) {
			continue;
		}
		packages.push({ name: pkg.name, version: pkg.version });
	}
	return packages.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * @param {string} repository `owner/repo`
 * @returns {{ owner: string; repo: string }}
 */
export function parseRepository(repository) {
	const trimmed = String(repository ?? "").trim();
	const slash = trimmed.indexOf("/");
	if (slash <= 0 || slash === trimmed.length - 1) {
		throw new Error(
			`GITHUB_REPOSITORY must be owner/repo, got ${JSON.stringify(repository)}`,
		);
	}
	return {
		owner: trimmed.slice(0, slash),
		repo: trimmed.slice(slash + 1),
	};
}

/**
 * @param {{
 *   owner: string;
 *   repo: string;
 *   tag: string;
 *   token: string;
 *   fetchImpl?: typeof fetch;
 * }} options
 * @returns {Promise<{ id: number; tag_name: string; prerelease: boolean }>}
 */
export async function fetchReleaseByTag(options) {
	const fetchImpl = options.fetchImpl ?? fetch;
	const url = `https://api.github.com/repos/${options.owner}/${options.repo}/releases/tags/${encodeURIComponent(options.tag)}`;
	const response = await fetchImpl(url, {
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${options.token}`,
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});
	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`GET release ${options.tag} failed (${response.status}): ${body}`,
		);
	}
	const data =
		/** @type {{ id: number; tag_name: string; prerelease: boolean }} */ (
			await response.json()
		);
	return data;
}

/**
 * @param {{
 *   owner: string;
 *   repo: string;
 *   releaseId: number;
 *   prerelease: boolean;
 *   makeLatest: "true" | "false";
 *   token: string;
 *   fetchImpl?: typeof fetch;
 * }} options
 * @returns {Promise<void>}
 */
export async function updateReleaseLatest(options) {
	const fetchImpl = options.fetchImpl ?? fetch;
	const url = `https://api.github.com/repos/${options.owner}/${options.repo}/releases/${options.releaseId}`;
	const response = await fetchImpl(url, {
		method: "PATCH",
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${options.token}`,
			"Content-Type": "application/json",
			"X-GitHub-Api-Version": "2022-11-28",
		},
		body: JSON.stringify({
			prerelease: options.prerelease,
			make_latest: options.makeLatest,
		}),
	});
	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`PATCH release ${options.releaseId} failed (${response.status}): ${body}`,
		);
	}
}

/**
 * @param {{
 *   rootDir?: string;
 *   packagesJson?: string;
 *   fromWorkspace?: boolean;
 *   dryRun?: boolean;
 *   env?: NodeJS.ProcessEnv;
 *   fetchImpl?: typeof fetch;
 *   log?: (message: string) => void;
 *   warn?: (message: string) => void;
 * }} [options]
 * @returns {Promise<{
 *   status: "ok" | "skipped";
 *   reason?: string;
 *   updates: { tag: string; makeLatest: "true" | "false" }[];
 * }>}
 */
export async function markGithubReleasesLatest(options = {}) {
	const rootDir = options.rootDir ?? defaultRootDir;
	const env = options.env ?? process.env;
	const log = options.log ?? console.log;
	const warn = options.warn ?? console.warn;

	const { pre } = loadPreJson(rootDir);
	if (!shouldMarkGithubReleasesLatest(pre)) {
		const reason = skipReasonForGithubLatest(pre);
		log(reason);
		return { status: "skipped", reason, updates: [] };
	}

	/** @type {{ name: string; version: string }[]} */
	let packages;
	if (options.fromWorkspace) {
		packages = listWorkspacePrereleasePackages(rootDir);
	} else {
		packages = parsePublishedPackages(options.packagesJson ?? "[]").filter(
			(pkg) => isSemverPrerelease(pkg.version),
		);
	}

	if (packages.length === 0) {
		const reason = "No SemVer-prerelease packages to mark; nothing to do";
		log(reason);
		return { status: "skipped", reason, updates: [] };
	}

	const latestPkg = pickLatestReleasePackage(packages);
	if (!latestPkg) {
		const reason = "No package selected for make_latest; nothing to do";
		log(reason);
		return { status: "skipped", reason, updates: [] };
	}

	const token = env.GITHUB_TOKEN || "";
	if (!token && !options.dryRun) {
		const reason =
			"GITHUB_TOKEN is not set; cannot update GitHub Releases. Pass the GitHub App token used by changesets/action.";
		warn(`::warning::${reason}`);
		return { status: "skipped", reason, updates: [] };
	}

	const { owner, repo } = parseRepository(
		env.GITHUB_REPOSITORY || "yamcodes/arkenv",
	);

	/** @type {{ tag: string; makeLatest: "true" | "false" }[]} */
	const updates = [];

	for (const pkg of packages) {
		const tag = releaseTagName(pkg.name, pkg.version);
		const makeLatest =
			pkg.name === latestPkg.name && pkg.version === latestPkg.version
				? "true"
				: "false";
		updates.push({ tag, makeLatest });

		const summary = `GitHub release ${tag}: prerelease=false, make_latest=${makeLatest}`;
		if (options.dryRun) {
			log(`[dry-run] ${summary}`);
			continue;
		}

		log(summary);
		const release = await fetchReleaseByTag({
			owner,
			repo,
			tag,
			token,
			fetchImpl: options.fetchImpl,
		});
		await updateReleaseLatest({
			owner,
			repo,
			releaseId: release.id,
			prerelease: false,
			makeLatest,
			token,
			fetchImpl: options.fetchImpl,
		});
	}

	return { status: "ok", updates };
}

/**
 * @param {string[]} argv
 * @returns {{ packagesJson?: string; fromWorkspace: boolean; dryRun: boolean; help: boolean }}
 */
export function parseArgs(argv) {
	/** @type {{ packagesJson?: string; fromWorkspace: boolean; dryRun: boolean; help: boolean }} */
	const result = { fromWorkspace: false, dryRun: false, help: false };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--packages") {
			result.packagesJson = argv[++i] ?? "";
		} else if (arg === "--from-workspace") {
			result.fromWorkspace = true;
		} else if (arg === "--dry-run") {
			result.dryRun = true;
		} else if (arg === "--help" || arg === "-h") {
			result.help = true;
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}
	if (result.fromWorkspace && result.packagesJson != null) {
		throw new Error("Use either --packages or --from-workspace, not both");
	}
	if (!result.fromWorkspace && result.packagesJson == null && !result.help) {
		throw new Error("Pass --packages <json> or --from-workspace");
	}
	return result;
}

function printHelp() {
	console.log(`Usage:
  node scripts/mark-github-releases-latest.js --packages '[{"name":"arkenv","version":"1.0.0-rc.2"}]'
  node scripts/mark-github-releases-latest.js --from-workspace
  node scripts/mark-github-releases-latest.js --packages '…' --dry-run

Only runs while .changeset/pre.json has mode "pre".
GitHub forbids Latest on prereleases, so this clears the GitHub
prerelease flag and sets make_latest on the preferred package (arkenv).
Requires GITHUB_TOKEN. Does not change npm dist-tags.`);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		printHelp();
		process.exit(0);
	}
	await markGithubReleasesLatest({
		packagesJson: args.packagesJson,
		fromWorkspace: args.fromWorkspace,
		dryRun: args.dryRun,
	});
}

const isDirectRun =
	Boolean(process.argv[1]) &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
}
