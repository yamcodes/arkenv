import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

const targets = [
	"packages/arkenv/dist/standard.mjs",
	"packages/arkenv/dist/standard.cjs",
	"packages/arkenv/dist/standard.d.mts",
	"packages/arkenv/dist/standard.d.cts",
	"packages/arkenv/dist/core.mjs",
	"packages/arkenv/dist/core.cjs",
	"packages/arkenv/dist/core.d.mts",
	"packages/arkenv/dist/core.d.cts",
];

const patterns = [
	/import\s+(?:.*?\s+from\s+)?['"]arktype['"]/i,
	/export\s+(?:.*?\s+from\s+)?['"]arktype['"]/i,
	/(?:import|require)\s*\(\s*['"]arktype['"]\s*\)/i,
];

function checkFile(filePath) {
	const absolutePath = path.join(rootDir, filePath);
	if (!fs.existsSync(absolutePath)) {
		console.error(`❌ Error: File not found: ${filePath}`);
		console.error("Make sure to run a build first: pnpm run build");
		process.exit(1);
	}

	const content = fs.readFileSync(absolutePath, "utf-8");

	for (const pattern of patterns) {
		if (pattern.test(content)) {
			console.error(
				`❌ Error: Forbidden reference to 'arktype' found in ${filePath}`,
			);
			console.error(`Matched pattern: ${pattern.toString()}`);
			process.exit(1);
		}
	}
}

console.log("🔍 Running Static Analysis Verification on built artifacts...");

// 1. Check for forbidden references
for (const target of targets) {
	checkFile(target);
	console.log(`✅ Passed: ${target}`);
}

// 2. Check bundle size limits
console.log("\n📦 Running size-limit validation...");
try {
	execSync("pnpm --filter arkenv run size", { cwd: rootDir, stdio: "inherit" });
	console.log("✅ Passed: size-limit validation");
} catch (error) {
	console.error("❌ Error: size-limit validation failed");
	process.exit(1);
}

console.log("\n✨ All artifact verifications passed successfully!");
