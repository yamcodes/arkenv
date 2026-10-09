#!/usr/bin/env node
/**
 * Frozen `nub install`, then a lockfile refresh when the manifest moved.
 *
 * Hosted Renovate has no Nub manager, so dependency PRs edit package.json
 * and leave nub.lock unchanged. In CI, `nub install` is frozen and exits 16
 * with ERR_NUB_OUTDATED_LOCKFILE. autofix runs this script, then
 * autofix.ci commits the refreshed nub.lock. The next CI run installs
 * from that lockfile.
 *
 * Usage:
 *   node scripts/nub-install-refresh-lockfile.js
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Nub's frozen-install status for ERR_NUB_OUTDATED_LOCKFILE (0.9.x). */
export const OUTDATED_LOCKFILE_STATUS = 16;

export const OUTDATED_LOCKFILE_CODE = "ERR_NUB_OUTDATED_LOCKFILE";

/**
 * @typedef {object} NubResult
 * @property {number | null} status
 * @property {string} [stdout]
 * @property {string} [stderr]
 */

/**
 * @typedef {(args: string[]) => NubResult} NubRun
 */

/**
 * Run Nub. The frozen attempt is captured so a drift error can be detected.
 * The refresh streams straight to the terminal: a full install log can exceed
 * spawnSync's default maxBuffer.
 *
 * @param {string[]} args
 * @returns {NubResult}
 */
function runNub(args) {
	const capture = !args.includes("--no-frozen-lockfile");
	const result = spawnSync("nub", args, {
		encoding: "utf8",
		stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit",
	});
	if (capture) {
		if (result.stdout) process.stdout.write(result.stdout);
		if (result.stderr) process.stderr.write(result.stderr);
	}
	if (result.error) console.error(result.error.message);
	return {
		status: result.status,
		stdout: result.stdout ?? "",
		stderr: `${result.stderr ?? ""}${result.error ? `\n${result.error.message}` : ""}`,
	};
}

/**
 * @param {NubResult} result
 * @returns {boolean}
 */
export function isOutdatedLockfile(result) {
	if (result.status !== OUTDATED_LOCKFILE_STATUS) return false;
	const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
	return output.includes(OUTDATED_LOCKFILE_CODE);
}

/**
 * Install dependencies. When the lockfile is behind package.json, install
 * again with `--no-frozen-lockfile` so nub.lock matches the manifest.
 *
 * @param {{ run?: NubRun, log?: (line: string) => void }} [options]
 * @returns {number} Process status. `1` when Nub exits from a signal.
 */
export function installRefreshingLockfile(options = {}) {
	const run = options.run ?? runNub;
	const log = options.log ?? ((line) => console.error(line));
	const first = run(["install"]);
	if ((first.status ?? 1) === 0) return 0;
	if (!isOutdatedLockfile(first)) return first.status ?? 1;

	log(
		"nub.lock is behind package.json. Refreshing it so the updated lockfile can be committed.",
	);
	const second = run(["install", "--no-frozen-lockfile"]);
	return second.status ?? 1;
}

const isMain =
	Boolean(process.argv[1]) &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
	process.exit(installRefreshingLockfile());
}
