/**
 * Point npm `latest` at RC package versions.
 *
 * During the product RC window, bare installs (`npx arkenv`, untagged
 * `pnpm add @arkenv/core`) must resolve to the current `1.0.0-rc.n`.
 * Changesets pre mode only updates the `rc` dist-tag; this script also
 * sets `latest`.
 *
 * Gates (all required):
 * - `.changeset/pre.json` has `"mode": "pre"` and `"tag": "rc"`.
 *   `changeset pre exit` sets `"mode": "exit"` (the file is deleted later
 *   by `changeset version`), so GA naturally disables this.
 * - Auth (one of):
 *   - CI: granular npm token in `NODE_AUTH_TOKEN` or `NPM_TOKEN` with
 *     **Read and write (stage only)** (dist-tag moves; not publish).
 *     Publish stays on OIDC trusted publishing. The npm CLI has no OIDC
 *     exchange for `dist-tag`, so the repo secret is the CI path.
 *   - Local: `--local` after `npm login` (uses your user npmrc; no
 *     `NPM_TOKEN`). Write commands (`dist-tag add`) use `stdio: "inherit"`
 *     so npm can prompt for OTP when 2FA is on auth-and-writes. Prefer
 *     `--otp <code>` or `NPM_CONFIG_OTP` so one OTP covers every package
 *     (otherwise npm prompts once per `dist-tag add` process). Prefer
 *     this when package Publishing access disallows tokens or the CI
 *     secret is not worth fighting.
 *
 * Usage:
 *   node scripts/point-latest-at-rc.js --packages '[{"name":"pkg","version":"1.0.0-rc.2"}]'
 *   node scripts/point-latest-at-rc.js --from-rc
 *   node scripts/point-latest-at-rc.js --from-rc --local
 *   node scripts/point-latest-at-rc.js --from-rc --local --otp 123456
 *   node scripts/point-latest-at-rc.js --packages '…' --dry-run
 */

import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
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
 * Prefix npm args with `--userconfig` when an auth npmrc path is set.
 * @param {string[]} args
 * @param {string | undefined} npmrcPath
 * @returns {string[]}
 */
export function withUserconfig(args, npmrcPath) {
	if (!npmrcPath) return args;
	return ["--userconfig", npmrcPath, ...args];
}

/**
 * Append `--otp <code>` so one OTP covers every write in the run
 * (npm otherwise prompts once per process on auth-and-writes 2FA).
 * @param {string[]} args
 * @param {string | undefined} otp
 * @returns {string[]}
 */
export function withOtp(args, otp) {
	if (!otp) return args;
	return [...args, "--otp", otp];
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string}
 */
export function resolveAuthToken(env = process.env) {
	return env.NODE_AUTH_TOKEN || env.NPM_TOKEN || "";
}

/**
 * Prefer an explicit `--otp` / options.otp; else honor `NPM_CONFIG_OTP`
 * (npm's config env for the same value).
 * @param {{ otp?: string; env?: NodeJS.ProcessEnv }} [options]
 * @returns {string}
 */
export function resolveOtp(options = {}) {
	const fromOption = String(options.otp ?? "").trim();
	if (fromOption) return fromOption;
	const env = options.env ?? process.env;
	return String(env.NPM_CONFIG_OTP ?? "").trim();
}

/**
 * Write an npmrc auth line so `npm dist-tag` can authenticate.
 * Publish uses OIDC; dist-tag uses the NPM_TOKEN secret (no CLI OIDC
 * exchange for dist-tag). Callers pass this path via `--userconfig` so
 * we never overwrite the developer's real `~/.npmrc`.
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
 * Create a temp directory + `.npmrc` path for auth (does not write yet).
 * @param {{ mkdtempSync?: typeof mkdtempSync; tmpdir?: typeof tmpdir }} [fs]
 * @returns {string}
 */
export function createTempNpmrcPath(fs = {}) {
	const mkdtemp = fs.mkdtempSync ?? mkdtempSync;
	const getTmp = fs.tmpdir ?? tmpdir;
	const dir = mkdtemp(join(getTmp(), "arkenv-npmrc-"));
	return join(dir, ".npmrc");
}

/**
 * @param {unknown} pre
 * @returns {string}
 */
export function skipReasonForPre(pre) {
	if (pre == null) {
		return "Not in Changesets pre mode (.changeset/pre.json missing); skipping latest retag";
	}
	const record = /** @type {{ mode?: unknown; tag?: unknown }} */ (pre);
	if (record.mode !== "pre") {
		return `Changesets pre.json mode is ${JSON.stringify(record.mode)} (not "pre"); skipping latest retag`;
	}
	return `Pre tag is ${JSON.stringify(record.tag)} (not rc); skipping latest retag`;
}

/**
 * Run `npm` with captured stdout (CI / read commands) or inherited
 * stdio (local writes that may need an interactive OTP prompt).
 * `execFileSync` returns `null` when stdio is fully inherited — never
 * `.trim()` that return value.
 *
 * @param {string[]} args
 * @param {{ inherit?: boolean }} [opts]
 * @param {typeof execFileSync} [exec]
 * @returns {string}
 */
export function runNpm(args, opts = {}, exec = execFileSync) {
	if (opts.inherit) {
		exec("npm", args, { stdio: "inherit" });
		return "";
	}
	const out = exec("npm", args, {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
	return String(out ?? "").trim();
}

/**
 * @param {{
 *   rootDir?: string;
 *   packagesJson?: string;
 *   fromRc?: boolean;
 *   dryRun?: boolean;
 *   local?: boolean;
 *   otp?: string;
 *   env?: NodeJS.ProcessEnv;
 *   npmrcPath?: string;
 *   execNpm?: (args: string[], opts?: { inherit?: boolean }) => string;
 *   log?: (message: string) => void;
 *   warn?: (message: string) => void;
 * }} [options]
 * @returns {{ status: "ok" | "skipped"; reason?: string; commands: string[][]; npmrcPath?: string }}
 */
export function pointLatestAtRc(options = {}) {
	const rootDir = options.rootDir ?? defaultRootDir;
	const env = options.env ?? process.env;
	const log = options.log ?? console.log;
	const warn = options.warn ?? console.warn;
	const local = Boolean(options.local);
	const otp = resolveOtp({ otp: options.otp, env });
	const execNpm = options.execNpm ?? runNpm;

	const { pre } = loadPreJson(rootDir);
	if (!shouldRetagLatest(pre)) {
		const reason = skipReasonForPre(pre);
		log(reason);
		return { status: "skipped", reason, commands: [] };
	}

	const token = resolveAuthToken(env);
	if (!token && !options.dryRun && !local) {
		const reason =
			"NPM_TOKEN / NODE_AUTH_TOKEN is not set. OIDC does not cover npm dist-tag (no CLI OIDC exchange). Set the NPM_TOKEN repo secret to a granular stage-only token (dist-tag; not publish), then re-run or use workflow_dispatch → promote_rc_to_latest. Or run locally: pnpm point-latest-at-rc (after npm login).";
		warn(`::warning::${reason}`);
		return { status: "skipped", reason, commands: [] };
	}

	if (local && !options.dryRun) {
		try {
			const who = execNpm(["whoami"]);
			log(`Using local npm auth as ${who || "(unknown)"}`);
		} catch (error) {
			const detail = error instanceof Error ? error.message : String(error);
			throw new Error(
				`Local mode requires npm auth (npm login / existing ~/.npmrc). npm whoami failed: ${detail}`,
			);
		}
	}

	/** @type {{ name: string; version: string }[]} */
	let packages;
	if (options.fromRc) {
		const names = listPublishablePackageNames(rootDir);
		packages = [];
		for (const name of names) {
			try {
				const version = execNpm(["view", `${name}@rc`, "version"]);
				if (!version) {
					warn(`::warning::No @rc version for ${name}; skipping that package`);
					continue;
				}
				packages.push({ name, version });
			} catch (error) {
				const detail = error instanceof Error ? error.message : String(error);
				warn(
					`::warning::Could not resolve ${name}@rc (${detail}); skipping that package`,
				);
			}
		}
	} else {
		packages = parsePublishedPackages(options.packagesJson ?? "[]");
	}

	if (packages.length === 0) {
		const reason = "No packages to retag; nothing to do";
		log(reason);
		return { status: "skipped", reason, commands: [] };
	}

	/** @type {string | undefined} */
	let npmrcPath;
	if (local) {
		// Ambient user npmrc (~/.npmrc or project .npmrc). Do not write a
		// temp --userconfig (that would ignore interactive login). Write
		// commands also pass inherit:true so stdin+stdout stay TTYs for OTP.
		npmrcPath = undefined;
	} else {
		npmrcPath =
			options.npmrcPath ?? (options.dryRun ? undefined : createTempNpmrcPath());
		if (!options.dryRun && npmrcPath) {
			writeNpmrcAuth(token, npmrcPath);
		}
	}

	/** @type {string[][]} */
	const commands = [];
	for (const { name, version } of packages) {
		const args = withOtp(
			withUserconfig(distTagAddArgs(name, version), npmrcPath),
			otp,
		);
		commands.push(args);
		const display = `npm ${args.join(" ")}`;
		if (options.dryRun) {
			log(`[dry-run] ${display}`);
			continue;
		}
		log(display);
		// Local writes need a TTY for npm's otplease OTP prompt when no
		// --otp / NPM_CONFIG_OTP is set (EOTP otherwise on auth-and-writes).
		// With a shared OTP, inherit is still fine but no longer required.
		// CI uses a token (usually Bypass 2FA) and does not inherit.
		execNpm(args, { inherit: local });
	}

	return { status: "ok", commands, npmrcPath };
}

/**
 * @param {string[]} argv
 * @returns {{ packagesJson?: string; fromRc: boolean; dryRun: boolean; local: boolean; otp?: string; help: boolean }}
 */
export function parseArgs(argv) {
	/** @type {{ packagesJson?: string; fromRc: boolean; dryRun: boolean; local: boolean; otp?: string; help: boolean }} */
	const result = { fromRc: false, dryRun: false, local: false, help: false };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--") {
			// pnpm may forward the run-script separator literally.
			continue;
		}
		if (arg === "--packages") {
			result.packagesJson = argv[++i] ?? "";
		} else if (arg === "--from-rc") {
			result.fromRc = true;
		} else if (arg === "--dry-run") {
			result.dryRun = true;
		} else if (arg === "--local") {
			result.local = true;
		} else if (arg === "--otp") {
			const value = argv[++i];
			if (value == null || value.startsWith("--")) {
				throw new Error("--otp requires a one-time password value");
			}
			result.otp = value;
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
  pnpm point-latest-at-rc
  pnpm point-latest-at-rc -- --otp <code>
  NPM_CONFIG_OTP=<code> pnpm point-latest-at-rc
  node scripts/point-latest-at-rc.js --packages '[{"name":"arkenv","version":"1.0.0-rc.2"}]'
  node scripts/point-latest-at-rc.js --from-rc
  node scripts/point-latest-at-rc.js --from-rc --local
  node scripts/point-latest-at-rc.js --from-rc --local --otp 123456
  node scripts/point-latest-at-rc.js --packages '…' --dry-run

Only runs while .changeset/pre.json has mode "pre" and tag "rc"
(changeset pre exit sets mode "exit"; file deleted later by version).

Auth:
  CI:    NPM_TOKEN or NODE_AUTH_TOKEN (granular stage-only dist-tag
         token; OIDC covers publish only — no CLI OIDC exchange for
         dist-tag). Soft-skips if the secret is missing.
  Local: pnpm point-latest-at-rc (wraps --from-rc --local after npm
         login; uses your user npmrc; no NPM_TOKEN). dist-tag writes
         inherit the TTY so OTP works. Prefer --otp <code> or
         NPM_CONFIG_OTP so one OTP covers all packages (else npm
         prompts once per package). Break-glass only — prefer
         workflow_dispatch → promote_rc_to_latest when the secret
         works. See skills/point-latest-at-rc/SKILL.md.`);
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		printHelp();
		process.exit(0);
	}
	pointLatestAtRc({
		packagesJson: args.packagesJson,
		fromRc: args.fromRc,
		dryRun: args.dryRun,
		local: args.local,
		otp: args.otp,
	});
	// skipped (no token / not rc) exits 0 so a missing secret does not
	// fail the release job after packages already published.
	// Failures throw from pointLatestAtRc / execNpm and are caught below.
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
