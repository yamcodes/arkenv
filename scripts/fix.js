#!/usr/bin/env node

/**
 * Unified fix script - single source of truth for what "fix" means in this codebase.
 *
 * Usage:
 *   node scripts/fix.js                    # Run biome + manypkg fix
 *   node scripts/fix.js --skip-manypkg     # Run biome only (skip manypkg)
 *   node scripts/fix.js --unsafe           # Run biome with --unsafe flag
 */

import { execSync } from "node:child_process";
import { argv, env } from "node:process";
import { unescapeMdxMarkers } from "./unescape-mdx-markers.js";

const args = argv.slice(2);

const skipManypkgFlag = args.includes("--skip-manypkg");
const skipManypkgEnv = env.SKIP_MANYPKG === "true" || env.SKIP_MANYPKG === "1";

const skipManypkg = skipManypkgFlag || skipManypkgEnv;

const unsafe = args.includes("--unsafe");

// Always run biome formatting
const biomeArgs = unsafe ? ["--write", "--unsafe", "."] : ["--write", "."];
console.log("Running biome check...");
execSync(`pnpm exec biome check ${biomeArgs.join(" ")}`, { stdio: "inherit" });

// Run mdxlint formatting
console.log("Running mdxlint fix...");
execSync("pnpm run fix:mdx", { stdio: "inherit" });

// Post-process mdxlint output to fix over-aggressive escaping.
// Walks the repo but skips node_modules/.git/dist and CHANGELOG.md so
// Changesets' intentional escapes are not corrupted.
console.log("Unescaping MDX markers...");
unescapeMdxMarkers(process.cwd());

// Conditionally run manypkg fix
if (!skipManypkg) {
	console.log("Running manypkg fix...");
	execSync("pnpm exec manypkg fix", { stdio: "inherit" });
} else {
	console.log("Skipping manypkg fix (SKIP_MANYPKG or --skip-manypkg)");
}
