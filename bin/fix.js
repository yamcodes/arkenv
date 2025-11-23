#!/usr/bin/env node

/**
 * Unified fix script - single source of truth for what "fix" means in this codebase.
 *
 * Usage:
 *   node bin/fix.js                    # Run biome + manypkg fix
 *   node bin/fix.js --skip-manypkg     # Run biome only (skip manypkg)
 *   node bin/fix.js --unsafe           # Run biome with --unsafe flag
 */

import { execSync } from "node:child_process";
import { argv } from "node:process";

const args = argv.slice(2);
const skipManypkg = args.includes("--skip-manypkg");
const unsafe = args.includes("--unsafe");

// Always run biome formatting
const biomeArgs = unsafe ? ["--write", "--unsafe", "."] : ["--write", "."];
console.log("Running biome check...");
execSync(`pnpm exec biome check ${biomeArgs.join(" ")}`, { stdio: "inherit" });

// Conditionally run manypkg fix
if (!skipManypkg) {
	console.log("Running manypkg fix...");
	execSync("pnpm exec manypkg fix", { stdio: "inherit" });
} else {
	console.log("Skipping manypkg fix (--skip-manypkg flag provided)");
}
