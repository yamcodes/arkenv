#!/usr/bin/env node
/**
 * Temporary guard while the monorepo uses Nub identity (`packageManager: nub@…`).
 * Corepack / muscle-memory `pnpm install` otherwise fails with a cryptic error.
 * Remove once contributors are used to `nub install` (or when Corepack knows Nub).
 */

const ua = process.env.npm_config_user_agent ?? "";
const isNub = /\bnub\b/i.test(ua);
const isPnpm = /\bpnpm\b/i.test(ua);
const isYarn = /\byarn\b/i.test(ua);
const isNpm = /\bnpm\b/i.test(ua) && !isNub;

if (isPnpm || isYarn || isNpm) {
	const detected = isPnpm ? "pnpm" : isYarn ? "yarn" : "npm";
	console.error(
		[
			"",
			`ArkEnv now uses Nub as the package manager (detected ${detected}).`,
			"Please run: nub install",
			"",
			"Install Nub: https://nubjs.com/docs",
			"  curl -fsSL https://nubjs.com/install.sh | bash",
			"  # or: npm install -g @nubjs/nub",
			"",
			"Do not mix pnpm/npm/yarn install into this tree.",
			"",
		].join("\n"),
	);
	process.exit(1);
}
