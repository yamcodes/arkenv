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
import fs from "node:fs";
import path from "node:path";
import { argv, env } from "node:process";

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

// Post-process mdxlint output to fix over-aggressive escaping
console.log("Unescaping MDX markers...");
const docsDir = path.join(process.cwd(), "apps/www/content/docs");
if (fs.existsSync(docsDir)) {
	const unescapeMarkers = (dir) => {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				unescapeMarkers(fullPath);
			} else if (
				entry.isFile() &&
				(entry.name.endsWith(".mdx") || entry.name.endsWith(".md"))
			) {
				let content = fs.readFileSync(fullPath, "utf8");
				let changed = false;
				if (content.includes("\\[!")) {
					content = content.replace(/\\\[!/g, "[!");
					changed = true;
				}
				if (content.includes("\\_")) {
					content = content.replace(/\\_/g, "_");
					changed = true;
				}
				if (changed) {
					fs.writeFileSync(fullPath, content);
				}
			}
		}
	};
	unescapeMarkers(process.cwd()); // Apply to whole project for underscores, specific for markers
}

// Conditionally run manypkg fix
if (!skipManypkg) {
	console.log("Running manypkg fix...");
	execSync("pnpm exec manypkg fix", { stdio: "inherit" });
} else {
	console.log("Skipping manypkg fix (SKIP_MANYPKG or --skip-manypkg)");
}
