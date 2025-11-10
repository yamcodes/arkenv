import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "bun";
import type { SizeInBytes } from "../types.ts";
import { getPackageNames } from "../utils/package.ts";
import { parseSizeToBytes } from "../utils/size.ts";
import { runSizeLimitOnPackage } from "./size-limit.ts";

// Function to get latest version of a package from npm
export const getLatestVersion = async (
	packageName: string,
): Promise<string | null> => {
	try {
		const proc = spawn(["npm", "view", packageName, "version"], {
			stdout: "pipe",
			stderr: "pipe",
		});

		const [stdout, stderr] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
		]);

		const exitCode = await proc.exited;
		if (exitCode !== 0) {
			console.log(`⚠️ Failed to get version for ${packageName}: ${stderr}`);
			return null;
		}

		return stdout.trim();
	} catch (error) {
		console.log(
			`⚠️ Error getting version for ${packageName}: ${error instanceof Error ? error.message : String(error)}`,
		);
		return null;
	}
};

// Function to download and extract npm package
export const downloadNpmPackage = async (
	packageName: string,
	version: string,
	targetDir: string,
): Promise<boolean> => {
	try {
		// Create target directory
		if (!existsSync(targetDir)) {
			mkdirSync(targetDir, { recursive: true });
		}

		// Construct tarball URL
		// For scoped packages: @scope/name -> scope-name-version.tgz
		// For unscoped packages: name -> name-version.tgz
		const tarballName = packageName.startsWith("@")
			? `${packageName.slice(1).replace("/", "-")}-${version}.tgz`
			: `${packageName}-${version}.tgz`;
		const tarballUrl = `https://registry.npmjs.org/${packageName}/-/${tarballName}`;

		console.log(`📦 Downloading ${packageName}@${version}...`);
		const downloadProc = spawn(
			["curl", "-L", "-o", join(targetDir, "package.tgz"), tarballUrl],
			{
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		const downloadExitCode = await downloadProc.exited;
		if (downloadExitCode !== 0) {
			console.log(`⚠️ Failed to download ${packageName}@${version}`);
			return false;
		}

		// Extract tarball
		const extractProc = spawn(
			[
				"tar",
				"-xzf",
				join(targetDir, "package.tgz"),
				"-C",
				targetDir,
				"--strip-components=1",
			],
			{
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		const extractExitCode = await extractProc.exited;
		if (extractExitCode !== 0) {
			console.log(`⚠️ Failed to extract ${packageName}@${version}`);
			return false;
		}

		return true;
	} catch (error) {
		console.log(
			`⚠️ Error downloading ${packageName}@${version}: ${error instanceof Error ? error.message : String(error)}`,
		);
		return false;
	}
};

// Function to get baseline sizes from npm
export const getBaselineSizesFromNpm = async (
	filter: string,
	isPR: boolean,
	isReleasePR: boolean,
): Promise<Map<string, SizeInBytes>> => {
	const baselineMap = new Map<string, SizeInBytes>();

	if (!isPR || !isReleasePR) {
		return baselineMap;
	}

	console.log(
		"📦 Fetching baseline sizes from npm (latest published versions)...",
	);

	const packageNames = getPackageNames(filter);
	const tempDir = join(process.cwd(), ".npm-baseline");

	// Clean up temp directory if it exists
	if (existsSync(tempDir)) {
		rmSync(tempDir, { recursive: true, force: true });
	}
	mkdirSync(tempDir, { recursive: true });

	try {
		for (const packageName of packageNames) {
			// Get latest version
			const version = await getLatestVersion(packageName);
			if (!version) {
				console.log(
					`⚠️ Could not get version for ${packageName}, skipping npm baseline`,
				);
				continue;
			}

			console.log(`📦 Found ${packageName}@${version} on npm`);

			// Download package
			const packageDir = join(tempDir, packageName);
			const downloaded = await downloadNpmPackage(
				packageName,
				version,
				packageDir,
			);

			if (!downloaded) {
				console.log(`⚠️ Failed to download ${packageName}, skipping`);
				continue;
			}

			// Run size-limit on the downloaded package to get accurate baseline
			console.log(`🔍 Running size-limit on ${packageName}@${version}...`);
			const sizeLimitResults = await runSizeLimitOnPackage(
				packageDir,
				packageName,
			);

			if (sizeLimitResults.length === 0) {
				console.log(
					`⚠️ No size-limit results for ${packageName}, skipping baseline`,
				);
				continue;
			}

			// Add results to baseline map
			for (const result of sizeLimitResults) {
				const key = `${result.package}:${result.file}`;
				const sizeBytes = parseSizeToBytes(result.size);
				baselineMap.set(key, sizeBytes);
				console.log(
					`✅ Baseline for ${key}: ${sizeBytes} bytes (from size-limit output: ${result.size})`,
				);
			}
		}

		if (baselineMap.size === 0) {
			console.log(
				"⚠️ No baseline sizes found from npm. This might be the first release.",
			);
		} else {
			console.log(`✅ Found ${baselineMap.size} baseline size(s) from npm`);
		}
	} catch (error) {
		console.log(
			`⚠️ Failed to get baseline sizes from npm: ${error instanceof Error ? error.message : String(error)}`,
		);
	} finally {
		// Clean up temp directory
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true });
		}
	}

	return baselineMap;
};
