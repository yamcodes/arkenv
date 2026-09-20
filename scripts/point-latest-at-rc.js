/**
 * Point npm `latest` at RC package versions.
 *
 * During the product RC window, bare installs (`npx arkenv`, untagged
 * `pnpm add @arkenv/core`) must resolve to the current `1.0.0-rc.n`.
 * Changesets pre mode only updates the `rc` dist-tag; this script also
 * sets `latest`.
 *
 * Gates (all required):
 * - `.changeset/pre.json` exists with `"tag": "rc"` (exiting pre removes
 *   the file, so GA naturally disables this).
 * - A granular npm token in `NODE_AUTH_TOKEN` or `NPM_TOKEN` with
 *   **Read and write (stage only)** (dist-tag moves; not publish).
 *   Publish stays on OIDC trusted publishing. The npm CLI has no OIDC
 *   exchange for `dist-tag`, so the repo secret is the supported path.
 *
 * Usage:
 *   node scripts/point-latest-at-rc.js --packages '[{"name":"pkg","version":"1.0.0-rc.2"}]'
 *   node scripts/point-latest-at-rc.js --from-rc
 *   node scripts/point-latest-at-rc.js --packages '…' --dry-run
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultRootDir = join(__dirname, "..");

/**
 * @param {unknown} pre
 * @returns {boolean}
 */
export function shouldRetagLatest(pre) {
	if (!pre || typeof pre !== "object") return false;
	const record = /** @type {{ mode?: unknown; tag?: unknown }} */ (pre);
	return record.mode === "pre" && record.tag === "rc";
}

/**
 * @param {string} rootDir
 * @param {{ existsSync?: typeof existsSync; readFileSync?: typeof readFileSync }} [fs]
 * @returns {{ pre: unknown | null; path: string }}
 */
export function loadPreJson(rootDir, fs = {}) {
	const exists = fs.existsSync ?? existsSync;
	const read = fs.readFileSync ?? readFileSync;
	const path = join(rootDir, ".changeset", "pre.json");
	if (!exists(path)) {
		return { pre: null, path };
	}
	return { pre: JSON.parse(read(path, "utf8")), path };
}

/**
 * @param {string} raw
 * @returns {{ name: string; version: string }[]}
 */
export function parsePublishedPackages(raw) {
	const trimmed = String(raw ?? "").trim();
	if (!trimmed || trimmed === "[]") return [];
	const parsed = JSON.parse(trimmed);
	if (!Array.isArray(parsed)) {
		throw new Error(
			`published packages must be a JSON array, got ${typeof parsed}`,
		);
	}
	/** @type {{ name: string; version: string }[]} */
	const packages = [];
	for (const entry of parsed) {
		if (
			!entry ||
			typeof entry !== "object" ||
			typeof entry.name !== "string" ||
			typeof entry.version !== "string" ||
			!entry.name ||
			!entry.version
		) {
			throw new Error(
				`invalid published package entry: ${JSON.stringify(entry)}`,
			);
		}
		packages.push({ name: entry.name, version: entry.version });
	}
	return packages;
}

/**
 * Discover non-private package names under `packages/`.
 * @param {string} rootDir
 * @param {{ readdirSync?: typeof readdirSync; readFileSync?: typeof readFileSync; existsSync?: typeof existsSync }} [fs]
 * @returns {string[]}
 */
export function listPublishablePackageNames(rootDir, fs = {}) {
	const readdir = fs.readdirSync ?? readdirSync;
	const read = fs.readFileSync ?? readFileSync;
	const exists = fs.existsSync ?? existsSync;
	const packagesDir = join(rootDir, "packages");
	if (!exists(packagesDir)) return [];

	/** @type {string[]} */
	const names = [];
	for (const entry of readdir(packagesDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const pkgPath = join(packagesDir, entry.name, "package.json");
		if (!exists(pkgPath)) continue;
		const pkg = JSON.parse(read(pkgPath, "utf8"));
		if (pkg.private || typeof pkg.name !== "string" || !pkg.name) continue;
		names.push(pkg.name);
	}
	return names.sort();
}

/**
 * @param {string} name
 * @param {string} version
 * @returns {string[]}
 */
export function distTagAddArgs(name, version) {
	return ["dist-tag", "add", `${name}@${version}`, "latest"];
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string}
 */
export function resolveAuthToken(env = process.env) {
	return env.NODE_AUTH_TOKEN || env.NPM_TOKEN || "";
}

/**
 * Write an npmrc auth line so `npm dist-tag` can authenticate.
 * Publish uses OIDC; dist-tag uses the NPM_TOKEN secret (no CLI OIDC
 * exchange for dist-tag).
 *
 * @param {string} token
 * @param {string} npmrcPath
 * @param {{ writeFileSync?: typeof writeFileSync }} [fs]
 */
export function writeNpmrcAuth(token, npmrcPath, fs = {}) {
	const write = fs.writeFileSync ?? writeFileSync;
	write(
		npmrcPath,
		`//registry.npmjs.org/:_authToken=${token}\nregistry=https://registry.npmjs.org/\n`,
		{ mode: 0o600 },
	);
}

/**
 * @param {{
 *   rootDir?: string;
 *   packagesJson?: string;
 *   fromRc?: boolean;
 *   dryRun?: boolean;
 *   env?: NodeJS.ProcessEnv;
 *   npmrcPath?: string;
 *   execNpm?: (args: string[]) => string;
 *   log?: (message: string) => void;
 *   warn?: (message: string) => void;
 * }} [options]
 * @returns {{ status: "ok" | "skipped" | "error"; reason?: string; commands: string[][] }}
 */
export function pointLatestAtRc(options = {}) {
	const rootDir = options.rootDir ?? defaultRootDir;
	const env = options.env ?? process.env;
	const log = options.log ?? console.log;
	const warn = options.warn ?? console.warn;
	const execNpm =
		options.execNpm ??
		((args) =>
			execFileSync("npm", args, {
				encoding: "utf8",
				stdio: ["ignore", "pipe", "pipe"],
			}).trim());

	const { pre } = loadPreJson(rootDir);
	if (!shouldRetagLatest(pre)) {
		const reason =
			pre == null
				? "Not in Changesets pre mode (.changeset/pre.json missing); skipping latest retag"
				: `Pre tag is ${JSON.stringify(/** @type {{ tag?: unknown }} */ (pre).tag)} (not rc); skipping latest retag`;
		log(reason);
		return { status: "skipped", reason, commands: [] };
	}

	const token = resolveAuthToken(env);
	if (!token && !options.dryRun) {
		const reason =
			"NPM_TOKEN / NODE_AUTH_TOKEN is not set. OIDC does not cover npm dist-tag (no CLI OIDC exchange). Set the NPM_TOKEN repo secret to a granular stage-only token (dist-tag; not publish), then re-run or use workflow_dispatch → promote_rc_to_latest.";
		warn(`::warning::${reason}`);
		return { status: "skipped", reason, commands: [] };
	}

	/** @type {{ name: string; version: string }[]} */
	let packages;
	if (options.fromRc) {
		const names = listPublishablePackageNames(rootDir);
		packages = names.map((name) => {
			const version = execNpm(["view", `${name}@rc`, "version"]);
			if (!version) {
				throw new Error(`npm view ${name}@rc version returned empty`);
			}
			return { name, version };
		});
	} else {
		packages = parsePublishedPackages(options.packagesJson ?? "[]");
	}

	if (packages.length === 0) {
		const reason = "No packages to retag; nothing to do";
		log(reason);
		return { status: "skipped", reason, commands: [] };
	}

	const npmrcPath = options.npmrcPath ?? join(homedir(), ".npmrc");
	if (!options.dryRun) {
		writeNpmrcAuth(token, npmrcPath);
	}

	/** @type {string[][]} */
	const commands = [];
	for (const { name, version } of packages) {
		const args = distTagAddArgs(name, version);
		commands.push(args);
		const display = `npm ${args.join(" ")}`;
		if (options.dryRun) {
			log(`[dry-run] ${display}`);
			continue;
		}
		log(display);
		execNpm(args);
	}

	return { status: "ok", commands };
}

/**
 * @param {string[]} argv
 * @returns {{ packagesJson?: string; fromRc: boolean; dryRun: boolean; help: boolean }}
 */
export function parseArgs(argv) {
	/** @type {{ packagesJson?: string; fromRc: boolean; dryRun: boolean; help: boolean }} */
	const result = { fromRc: false, dryRun: false, help: false };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--packages") {
			result.packagesJson = argv[++i] ?? "";
		} else if (arg === "--from-rc") {
			result.fromRc = true;
		} else if (arg === "--dry-run") {
			result.dryRun = true;
		} else if (arg === "--help" || arg === "-h") {
			result.help = true;
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}
	if (result.fromRc && result.packagesJson != null) {
		throw new Error("Use either --packages or --from-rc, not both");
	}
	if (!result.fromRc && result.packagesJson == null && !result.help) {
		throw new Error("Pass --packages <json> or --from-rc");
	}
	return result;
}

function printHelp() {
	console.log(`Usage:
  node scripts/point-latest-at-rc.js --packages '[{"name":"arkenv","version":"1.0.0-rc.2"}]'
  node scripts/point-latest-at-rc.js --from-rc
  node scripts/point-latest-at-rc.js --packages '…' --dry-run

Only runs while .changeset/pre.json has tag "rc".
Requires NPM_TOKEN or NODE_AUTH_TOKEN (granular stage-only dist-tag
token; OIDC covers publish only — no CLI OIDC exchange for dist-tag).`);
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		printHelp();
		process.exit(0);
	}
	const result = pointLatestAtRc({
		packagesJson: args.packagesJson,
		fromRc: args.fromRc,
		dryRun: args.dryRun,
	});
	if (result.status === "error") {
		process.exit(1);
	}
	// skipped (no token / not rc) exits 0 so a missing secret does not
	// fail the release job after packages already published.
}

const isDirectRun =
	Boolean(process.argv[1]) &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
	try {
		main();
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
}
