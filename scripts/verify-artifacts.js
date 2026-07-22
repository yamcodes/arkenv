import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	assertPackagesStandardIsolation,
	resolvePackageDirs,
} from "./standard-isolation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

const targets = [
	"packages/standard/dist/index.js",
	"packages/standard/dist/index.cjs",
	"packages/standard/dist/index.d.ts",
];

const patterns = [
	/import\s+(?:.*?\s+from\s+)?['"]arktype['"]/i,
	/export\s+(?:.*?\s+from\s+)?['"]arktype['"]/i,
	/(?:import|require)\s*\(\s*['"]arktype['"]\s*\)/i,
	/import\s+(?:.*?\s+from\s+)?['"]@arkenv\/core['"]/i,
	/export\s+(?:.*?\s+from\s+)?['"]@arkenv\/core['"]/i,
	/(?:import|require)\s*\(\s*['"]@arkenv\/core['"]\s*\)/i,
];

const failures = [];

function checkFile(filePath) {
	const absolutePath = path.join(rootDir, filePath);
	if (!fs.existsSync(absolutePath)) {
		failures.push({
			filePath,
			error: "File not found. Make sure to run a build first: pnpm run build",
		});
		return;
	}

	const content = fs.readFileSync(absolutePath, "utf-8");

	for (const pattern of patterns) {
		if (pattern.test(content)) {
			failures.push({
				filePath,
				error: `Forbidden reference found. Matched pattern: ${pattern.toString()}`,
			});
		}
	}
}

console.log("🔍 Running Static Analysis Verification on built artifacts...");

// 1. Check @arkenv/standard for forbidden references
for (const target of targets) {
	checkFile(target);
	if (!failures.some((f) => f.filePath === target)) {
		console.log(`✅ Passed: ${target}`);
	}
}

if (failures.length > 0) {
	console.error(
		"\n❌ Static Analysis Verification failed with the following errors:",
	);
	for (const failure of failures) {
		console.error(`- ${failure.filePath}: ${failure.error}`);
	}
	process.exit(1);
}

// 2. Guard integration `/standard` entries (import graph isolation)
console.log(
	"\n🔒 Verifying integration /standard entries never import arktype or @arkenv/core...",
);
try {
	await assertPackagesStandardIsolation(
		resolvePackageDirs(rootDir, [
			"packages/vite-plugin",
			"packages/bun-plugin",
			"packages/nextjs",
			"packages/nuxt",
		]),
	);
} catch (error) {
	console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
	process.exit(1);
}

// 3. Check bundle size limits
console.log("\n📦 Running size-limit validation...");
try {
	execSync("pnpm --filter @arkenv/core --filter @arkenv/standard run size", {
		cwd: rootDir,
		stdio: "inherit",
	});
	console.log("✅ Passed: size-limit validation");
} catch {
	console.error("❌ Error: size-limit validation failed");
	process.exit(1);
}

console.log("\n✨ All artifact verifications passed successfully!");
