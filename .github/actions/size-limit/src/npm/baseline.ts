import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { getPackageNames } from "../package/names.ts";
import { runSizeLimitOnPackage } from "../size-limit/package.ts";
import type { SizeInBytes } from "../types.ts";
import { parseSizeToBytes } from "../utils/size.ts";
import { downloadNpmPackage } from "./download.ts";
import { getLatestVersion } from "./version.ts";

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

			// Get size-limit config from current workspace (npm packages don't include it)
			let sizeLimitConfigFromWorkspace: unknown;
			try {
				// Try to find the package in the workspace
				// Handle both scoped (@arkenv/vite-plugin -> vite-plugin) and unscoped (arkenv -> arkenv) packages
				const packageDirName = packageName.startsWith("@")
					? (packageName.split("/")[1] ?? packageName)
					: packageName;
				const workspacePackageJsonPath = join(
					process.cwd(),
					"packages",
					packageDirName,
					"package.json",
				);
				if (existsSync(workspacePackageJsonPath)) {
					const workspacePackageJson = JSON.parse(
						readFileSync(workspacePackageJsonPath, "utf-8"),
					);
					sizeLimitConfigFromWorkspace = workspacePackageJson["size-limit"];
					console.log(
						`ℹ️ Found workspace config for ${packageName} at ${workspacePackageJsonPath}`,
					);
				} else {
					console.log(
						`⚠️ Workspace package.json not found at ${workspacePackageJsonPath}`,
					);
				}
			} catch (error) {
				console.log(
					`⚠️ Could not read workspace package.json for ${packageName}: ${error instanceof Error ? error.message : String(error)}`,
				);
			}

			// Run size-limit on the downloaded package to get accurate baseline
			console.log(`🔍 Running size-limit on ${packageName}@${version}...`);
			const sizeLimitResults = await runSizeLimitOnPackage(
				packageDir,
				packageName,
				sizeLimitConfigFromWorkspace,
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
