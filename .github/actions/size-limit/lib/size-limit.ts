import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "bun";
import type { SizeLimitResult } from "../types.ts";
import { parseSizeLimitOutput } from "../utils/parser.ts";

// Function to run size-limit and parse results
export const runSizeLimit = async (
	filter: string,
): Promise<{
	results: SizeLimitResult[];
	hasErrors: boolean;
	rawOutput?: string;
}> => {
	let sizeOutput = "";
	let hasErrors = false;

	try {
		const proc = spawn(["pnpm", "run", "size", "--filter", filter], {
			stdout: "pipe",
			stderr: "pipe",
		});

		const [stdout, stderr] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
		]);

		const exitCode = await proc.exited;
		sizeOutput = stdout + stderr;
		hasErrors = exitCode !== 0;
	} catch (error) {
		sizeOutput = error instanceof Error ? error.message : String(error);
		hasErrors = true;
	}

	const results = parseSizeLimitOutput(sizeOutput, filter);
	return { results, hasErrors, rawOutput: sizeOutput };
};

// Function to run size-limit on a specific package directory
export const runSizeLimitOnPackage = async (
	packageDir: string,
	packageName: string,
	sizeLimitConfigFromWorkspace?: unknown,
): Promise<SizeLimitResult[]> => {
	// Read package.json to get size-limit config
	const packageJsonPath = join(packageDir, "package.json");
	if (!existsSync(packageJsonPath)) {
		console.log(`⚠️ package.json not found for ${packageName}`);
		return [];
	}

	const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
	let sizeLimitConfig = packageJson["size-limit"];

	// If npm package doesn't have size-limit config (common since it's in devDependencies),
	// use the config from the current workspace
	if (
		(!Array.isArray(sizeLimitConfig) || sizeLimitConfig.length === 0) &&
		sizeLimitConfigFromWorkspace
	) {
		console.log(
			`ℹ️ npm package ${packageName} doesn't have size-limit config, using workspace config`,
		);
		sizeLimitConfig = sizeLimitConfigFromWorkspace;
	}

	if (!Array.isArray(sizeLimitConfig) || sizeLimitConfig.length === 0) {
		console.log(`⚠️ No size-limit config found for ${packageName}`);
		return [];
	}

	// For Node.js built-ins (node:util, etc.), esbuild needs platform: 'node' to handle them
	// The preset-small-lib uses esbuild, and we can try configuring it through the size-limit config
	// by adding an 'esbuild' property, or by creating an esbuild.config.js file as fallback
	const enhancedSizeLimitConfig = Array.isArray(sizeLimitConfig)
		? sizeLimitConfig.map((config) => {
				// Try adding esbuild config to tell it to bundle for Node.js
				// This makes Node.js built-ins like node:util available during bundling
				return {
					...config,
					esbuild: {
						platform: "node",
						external: [/^node:/],
					},
				};
			})
		: sizeLimitConfig;

	const tempPackageJson = {
		name: packageJson.name,
		version: packageJson.version,
		main: packageJson.main,
		module: packageJson.module,
		dependencies: {
			...(packageJson.dependencies || {}),
			...(packageJson.peerDependencies || {}),
		},
		"size-limit": enhancedSizeLimitConfig,
		devDependencies: {
			"size-limit": "11.2.0",
			"@size-limit/preset-small-lib": "11.2.0",
			"@size-limit/esbuild-why": "11.2.0",
		},
	};

	// Write temp package.json
	const tempPackageJsonPath = join(packageDir, "package.json.temp");
	await import("node:fs/promises").then((fs) =>
		fs.writeFile(tempPackageJsonPath, JSON.stringify(tempPackageJson, null, 2)),
	);

	// Backup original package.json
	const originalPackageJsonPath = join(packageDir, "package.json.backup");
	await import("node:fs/promises").then((fs) =>
		fs.copyFile(packageJsonPath, originalPackageJsonPath),
	);

	// Replace package.json temporarily
	await import("node:fs/promises").then((fs) =>
		fs.copyFile(tempPackageJsonPath, packageJsonPath),
	);

	// For Node.js built-ins (node:util, etc.), esbuild needs platform: 'node' to handle them
	// We'll set this via environment variable and also create an esbuild.config.js file
	// as a fallback in case the preset reads it
	const esbuildConfigPath = join(packageDir, "esbuild.config.js");
	const esbuildConfig = `module.exports = {
  platform: 'node',
  external: [/^node:/],
};
`;
	await import("node:fs/promises").then((fs) =>
		fs.writeFile(esbuildConfigPath, esbuildConfig),
	);

	try {
		// Install all dependencies (production + dev) from package.json
		// This includes both the package's dependencies (needed for bundling) and size-limit plugins
		console.log(`📦 Installing dependencies for ${packageName}...`);
		const installProc = spawn(["npm", "install"], {
			cwd: packageDir,
			stdout: "pipe",
			stderr: "pipe",
		});

		const installExitCode = await installProc.exited;
		if (installExitCode !== 0) {
			const [installStdout, installStderr] = await Promise.all([
				new Response(installProc.stdout).text(),
				new Response(installProc.stderr).text(),
			]);
			console.log(
				`⚠️ Failed to install dependencies: ${installStderr || installStdout}`,
			);
			// Continue anyway - npx might still work
		}

		// Run size-limit on this package
		// Set ESBUILD_PLATFORM=node environment variable to tell esbuild to bundle for Node.js
		// This makes Node.js built-ins like node:util available during bundling
		console.log(`🔍 Running size-limit on ${packageName}...`);
		const proc = spawn(["npx", "--yes", "size-limit", "--json"], {
			cwd: packageDir,
			stdout: "pipe",
			stderr: "pipe",
			env: {
				...process.env,
				ESBUILD_PLATFORM: "node",
			},
		});

		const [stdout, stderr] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
		]);

		const exitCode = await proc.exited;

		// Restore original package.json
		await import("node:fs/promises").then((fs) =>
			fs.copyFile(originalPackageJsonPath, packageJsonPath),
		);

		// Clean up temp files and esbuild config
		await import("node:fs/promises").then((fs) =>
			Promise.all([
				fs.unlink(tempPackageJsonPath).catch(() => {}),
				fs.unlink(originalPackageJsonPath).catch(() => {}),
				fs.unlink(esbuildConfigPath).catch(() => {}),
			]),
		);

		if (exitCode !== 0) {
			console.log(
				`⚠️ size-limit failed for ${packageName}: ${stderr || stdout}`,
			);
			return [];
		}

		// Parse JSON output from size-limit
		try {
			const sizeLimitOutput = JSON.parse(stdout);
			const results: SizeLimitResult[] = [];

			if (Array.isArray(sizeLimitOutput)) {
				for (const item of sizeLimitOutput) {
					if (item.name && item.size !== undefined) {
						const filename = item.name.split("/").pop() || "bundle";
						results.push({
							package: packageName,
							file: filename,
							size: `${item.size} B`,
							limit: item.limit || "N/A",
							status: item.passed ? "✅" : "❌",
						});
					}
				}
			}

			return results;
		} catch (parseError) {
			// Fallback to parsing text output if JSON fails
			console.log(
				`⚠️ Failed to parse JSON output, trying text parsing: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
			);
			return parseSizeLimitOutput(stdout + stderr, packageName);
		}
	} catch (error) {
		// Restore original package.json on error
		try {
			await import("node:fs/promises").then((fs) =>
				fs.copyFile(originalPackageJsonPath, packageJsonPath),
			);
		} catch {
			// Ignore restore errors
		}

		// Clean up esbuild config on error
		try {
			const esbuildConfigPath = join(packageDir, "esbuild.config.js");
			await import("node:fs/promises").then((fs) =>
				fs.unlink(esbuildConfigPath).catch(() => {}),
			);
		} catch {
			// Ignore cleanup errors
		}

		console.log(
			`⚠️ Error running size-limit on ${packageName}: ${error instanceof Error ? error.message : String(error)}`,
		);
		return [];
	}
};
