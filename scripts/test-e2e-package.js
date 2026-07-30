import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

console.log("🚀 Starting E2E Package Installation Tests...");

// 1. Build the packages in the workspace
console.log("\n📦 Building workspace packages...");
execSync("pnpm run build", { cwd: rootDir, stdio: "inherit" });

// 2. Pack the core and standard packages
const coreDir = path.join(rootDir, "packages/core");
const standardDir = path.join(rootDir, "packages/standard");

console.log("\n🎒 Packing @arkenv/core package...");
execSync("pnpm pack", { cwd: coreDir, stdio: "inherit" });

console.log("\n🎒 Packing @arkenv/standard package...");
execSync("pnpm pack", { cwd: standardDir, stdio: "inherit" });

// 3. Locate the tarballs
const coreFiles = fs.readdirSync(coreDir);
const coreTarballName = coreFiles.find((file) =>
	/^arkenv-core-\d+\.\d+\.\d+(?:-.*)?\.tgz$/.test(file),
);
if (!coreTarballName) {
	console.error(
		"❌ Error: Could not find generated @arkenv/core tarball (.tgz) file.",
	);
	process.exit(1);
}
const coreTarballPath = path.join(coreDir, coreTarballName);
console.log(`Found @arkenv/core tarball: ${coreTarballPath}`);

const standardFiles = fs.readdirSync(standardDir);
const standardTarballName = standardFiles.find((file) =>
	/^arkenv-standard-\d+\.\d+\.\d+(?:-.*)?\.tgz$/.test(file),
);
if (!standardTarballName) {
	console.error(
		"❌ Error: Could not find generated @arkenv/standard tarball (.tgz) file.",
	);
	process.exit(1);
}
const standardTarballPath = path.join(standardDir, standardTarballName);
console.log(`Found @arkenv/standard tarball: ${standardTarballPath}`);

// 4. Set up temporary directory in os.tmpdir()
const tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "arkenv-e2e-"));
console.log(`Created temporary E2E directory: ${tempBaseDir}`);

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

try {
	// Normalize path for Windows file url compatibility
	const normalizedCoreTarballPath = path
		.resolve(coreTarballPath)
		.replace(/\\/g, "/");
	const coreTarballDependency = `file:${normalizedCoreTarballPath}`;

	const normalizedStandardTarballPath = path
		.resolve(standardTarballPath)
		.replace(/\\/g, "/");
	const standardTarballDependency = `file:${normalizedStandardTarballPath}`;

	// We will run tests against examples/basic and the standard-only examples
	const fixtures = ["basic", "with-zod", "with-valibot"];

	// Standard-only fixtures use a Standard Schema validator (e.g. Zod, Valibot)
	// via `@arkenv/standard` and must NOT pull in the optional `arktype` peer.
	const standardOnlyFixtures = new Set(["with-zod", "with-valibot"]);

	for (const fixture of fixtures) {
		console.log(`\n=== Testing fixture: examples/${fixture} ===`);
		const fixtureSrcDir = path.join(rootDir, "examples", fixture);
		const fixtureDestDir = path.join(tempBaseDir, fixture);

		// Copy fixture files recursively (ignoring node_modules and dist if present)
		fs.cpSync(fixtureSrcDir, fixtureDestDir, {
			recursive: true,
			filter: (src) => {
				const relative = path.relative(fixtureSrcDir, src);
				return (
					!relative.startsWith("node_modules") && !relative.startsWith("dist")
				);
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

		// Update dependency to point to local tarballs
		const pkgJsonPath = path.join(fixtureDestDir, "package.json");
		const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
		if (fixture === "basic") {
			if (pkg.dependencies && pkg.dependencies["@arkenv/core"]) {
				pkg.dependencies["@arkenv/core"] = coreTarballDependency;
			} else {
				pkg.dependencies = pkg.dependencies || {};
				pkg.dependencies["@arkenv/core"] = coreTarballDependency;
			}
		} else if (standardOnlyFixtures.has(fixture)) {
			if (pkg.dependencies && pkg.dependencies["@arkenv/standard"]) {
				pkg.dependencies["@arkenv/standard"] = standardTarballDependency;
			} else {
				pkg.dependencies = pkg.dependencies || {};
				pkg.dependencies["@arkenv/standard"] = standardTarballDependency;
			}
		}
		fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2));

		// Remove lockfile for standard-only fixtures to ensure npm installs all dependencies fresh based on the modified package.json
		if (standardOnlyFixtures.has(fixture)) {
			const lockfilePath = path.join(fixtureDestDir, "package-lock.json");
			if (fs.existsSync(lockfilePath)) {
				fs.rmSync(lockfilePath, { force: true });
			}
		}

		// Run npm install
		console.log(`Running npm install in ${fixtureDestDir}...`);
		execSync(
			`${npmCmd} install --include=dev --no-fund --no-audit --prefer-offline`,
			{
				cwd: fixtureDestDir,
				stdio: "inherit",
				env: {
					...process.env,
					NODE_ENV: "development",
				},
				shell: true,
			},
		);

		// For standard-only fixtures, assert that arktype is NOT installed
		if (standardOnlyFixtures.has(fixture)) {
			const arktypePath = path.join(fixtureDestDir, "node_modules", "arktype");
			if (fs.existsSync(arktypePath)) {
				throw new Error(
					`Optional peer dependency 'arktype' was mistakenly installed in clean-room standard-only fixture '${fixture}'.`,
				);
			}
			console.log(
				`✅ Verified: 'arktype' is NOT present in ${fixture} fixture node_modules`,
			);
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
			if (
				!stdout.includes(
					"Environment variables validated successfully by ArkEnv!",
				)
			) {
				throw new Error(
					"Fixture 'basic' did not print expected output: 'Environment variables validated successfully by ArkEnv!'",
				);
			}
		} else if (standardOnlyFixtures.has(fixture)) {
			if (!stdout.includes("Value: https://example.com")) {
				throw new Error(
					`Fixture '${fixture}' did not print expected output: 'Value: https://example.com'`,
				);
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

	// Cleanup tarballs
	console.log(`🧹 Cleaning up packed tarball ${coreTarballPath}...`);
	try {
		fs.rmSync(coreTarballPath, { force: true });
	} catch (e) {
		console.warn(`Warning: Failed to clean up core tarball: ${e.message}`);
	}
	console.log(`🧹 Cleaning up packed tarball ${standardTarballPath}...`);
	try {
		fs.rmSync(standardTarballPath, { force: true });
	} catch (e) {
		console.warn(`Warning: Failed to clean up standard tarball: ${e.message}`);
	}
}

console.log("\n✨ E2E Package Installation Tests passed successfully!");
