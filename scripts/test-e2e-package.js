import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

console.log("🚀 Starting E2E Package Installation Tests...");

// 1. Build the packages in the workspace
console.log("\n📦 Building workspace packages...");
execSync("pnpm run build", { cwd: rootDir, stdio: "inherit" });

// 2. Pack the arkenv package
const arkenvDir = path.join(rootDir, "packages/arkenv");
console.log("\n🎒 Packing arkenv package...");
execSync("pnpm pack", { cwd: arkenvDir, stdio: "inherit" });

// 3. Locate the tarball
const files = fs.readdirSync(arkenvDir);
const tarballName = files.find((file) => /^arkenv-\d+\.\d+\.\d+(?:-.*)?\.tgz$/.test(file));
if (!tarballName) {
	console.error("❌ Error: Could not find generated arkenv tarball (.tgz) file.");
	process.exit(1);
}
const tarballPath = path.join(arkenvDir, tarballName);
console.log(`Found tarball: ${tarballPath}`);

// 4. Set up temporary directory in os.tmpdir()
const tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "arkenv-e2e-"));
console.log(`Created temporary E2E directory: ${tempBaseDir}`);

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

try {
	// Normalize path for Windows file url compatibility
	const normalizedTarballPath = path.resolve(tarballPath).replace(/\\/g, "/");
	const tarballDependency = `file:${normalizedTarballPath}`;

	// We will run tests against examples/basic and examples/with-zod
	const fixtures = ["basic", "with-zod"];

	for (const fixture of fixtures) {
		console.log(`\n=== Testing fixture: examples/${fixture} ===`);
		const fixtureSrcDir = path.join(rootDir, "examples", fixture);
		const fixtureDestDir = path.join(tempBaseDir, fixture);

		// Copy fixture files recursively (ignoring node_modules and dist if present)
		fs.cpSync(fixtureSrcDir, fixtureDestDir, {
			recursive: true,
			filter: (src) => {
				const relative = path.relative(fixtureSrcDir, src);
				return !relative.startsWith("node_modules") && !relative.startsWith("dist");
			},
		});

		// Copy or generate .env file
		const envExamplePath = path.join(fixtureDestDir, ".env.example");
		const envPath = path.join(fixtureDestDir, ".env");
		if (fs.existsSync(envExamplePath)) {
			fs.copyFileSync(envExamplePath, envPath);
		} else {
			fs.writeFileSync(
				envPath,
				"HOST=localhost\nPORT=3000\nTEST_VALUE=https://example.com\n",
			);
		}

		// Update dependency on arkenv to point to local tarball
		const pkgJsonPath = path.join(fixtureDestDir, "package.json");
		const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
		if (pkg.dependencies && pkg.dependencies["arkenv"]) {
			pkg.dependencies["arkenv"] = tarballDependency;
		} else if (pkg.devDependencies && pkg.devDependencies["arkenv"]) {
			pkg.devDependencies["arkenv"] = tarballDependency;
		} else {
			pkg.dependencies = pkg.dependencies || {};
			pkg.dependencies["arkenv"] = tarballDependency;
		}
		fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2));

		// Run npm install
		console.log(`Running npm install in ${fixtureDestDir}...`);
		execSync(`${npmCmd} install --no-fund --no-audit --prefer-offline`, {
			cwd: fixtureDestDir,
			stdio: "inherit",
			shell: true,
		});

		// For with-zod, assert that arktype is NOT installed
		if (fixture === "with-zod") {
			const arktypePath = path.join(fixtureDestDir, "node_modules", "arktype");
			if (fs.existsSync(arktypePath)) {
				throw new Error("Optional peer dependency 'arktype' was mistakenly installed in clean-room standard-only fixture.");
			}
			console.log("✅ Verified: 'arktype' is NOT present in standard-schema fixture node_modules");
		}

		// Run start script and assert output
		console.log(`Executing start script in ${fixtureDestDir}...`);
		const stdout = execSync(`${npmCmd} run start`, {
			cwd: fixtureDestDir,
			encoding: "utf-8",
			shell: true,
		});

		console.log("Stdout output:\n" + stdout);

		// Assertions
		if (fixture === "basic") {
			if (!stdout.includes("Hello world!")) {
				throw new Error("Fixture 'basic' did not print expected output: 'Hello world!'");
			}
		} else if (fixture === "with-zod") {
			if (!stdout.includes("Value: https://example.com")) {
				throw new Error("Fixture 'with-zod' did not print expected output: 'Value: https://example.com'");
			}
		}

		console.log(`✅ Fixture examples/${fixture} passed E2E installation test!`);
	}
} finally {
	// Cleanup E2E directory
	console.log(`\n🧹 Cleaning up E2E temporary files in ${tempBaseDir}...`);
	try {
		fs.rmSync(tempBaseDir, { recursive: true, force: true });
	} catch (e) {
		console.warn(`Warning: Failed to clean up temp base dir: ${e.message}`);
	}

	// Cleanup tarball
	console.log(`🧹 Cleaning up packed tarball ${tarballPath}...`);
	try {
		fs.rmSync(tarballPath, { force: true });
	} catch (e) {
		console.warn(`Warning: Failed to clean up tarball: ${e.message}`);
	}
}

console.log("\n✨ E2E Package Installation Tests passed successfully!");
