import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "bun";
import type { SizeLimitResult } from "../types.ts";
import { parseSizeLimitOutput } from "../utils/parser.ts";

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

	// Enhance size-limit config to mark Node.js built-in modules as external
	// This prevents bundling errors when size-limit tries to bundle Node.js built-in modules
	const enhancedSizeLimitConfig = sizeLimitConfig.map((config) => {
		// If webpack is explicitly enabled, preserve the webpack configuration
		if (config.webpack !== undefined) {
			return config;
		}

		// For Node.js packages, configure esbuild to mark Node.js built-in modules as external
		// This prevents esbuild from trying to bundle node:path, node:fs, etc.
		// size-limit uses esbuild when webpack: false, and we can configure externals
		const nodeBuiltinModules = [
			"assert",
			"async_hooks",
			"buffer",
			"child_process",
			"cluster",
			"console",
			"constants",
			"crypto",
			"dgram",
			"diagnostics_channel",
			"dns",
			"domain",
			"events",
			"fs",
			"http",
			"http2",
			"https",
			"inspector",
			"module",
			"net",
			"os",
			"path",
			"perf_hooks",
			"process",
			"punycode",
			"querystring",
			"readline",
			"repl",
			"stream",
			"string_decoder",
			"sys",
			"timers",
			"tls",
			"trace_events",
			"tty",
			"url",
			"util",
			"v8",
			"vm",
			"worker_threads",
			"zlib",
		];

		return {
			...config,
			// Use esbuild (default in preset-small-lib) and configure it to mark Node.js built-in modules as external
			// This tells esbuild not to try to bundle these modules
			// size-limit passes this to esbuild's external option
			ignore: [
				...(config.ignore
					? Array.isArray(config.ignore)
						? config.ignore
						: [config.ignore]
					: []),
				...nodeBuiltinModules.map((m) => `node:${m}`),
				...nodeBuiltinModules,
			],
		};
	});

	// Create a temporary package.json with size-limit config and dependencies
	// We need to preserve the package name, main/module fields, and dependencies for size-limit to work
	// Also need to include the preset in devDependencies so size-limit can find it
	// Include peerDependencies as regular dependencies since bun install won't install them automatically
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

	try {
		// Install all dependencies (production + dev) from package.json
		// This includes both the package's dependencies (needed for bundling) and size-limit plugins
		console.log(`📦 Installing dependencies for ${packageName}...`);
		const installProc = spawn(["bun", "install"], {
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
			// Continue anyway - bunx might still work
		}

		// Run size-limit on this package
		console.log(`🔍 Running size-limit on ${packageName}...`);
		const proc = spawn(["bunx", "size-limit", "--json"], {
			cwd: packageDir,
			stdout: "pipe",
			stderr: "pipe",
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

		// Clean up temp files
		await import("node:fs/promises").then((fs) =>
			Promise.all([
				fs.unlink(tempPackageJsonPath).catch(() => {}),
				fs.unlink(originalPackageJsonPath).catch(() => {}),
			]),
		);

		// Try to parse JSON output even if exit code is non-zero
		// size-limit can return valid JSON with passed: false when limits are exceeded
		let results: SizeLimitResult[] = [];
		try {
			const sizeLimitOutput = JSON.parse(stdout);
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
		} catch (parseError) {
			// If JSON parsing fails, try text parsing
			console.log(
				`⚠️ Failed to parse JSON output, trying text parsing: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
			);
			results = parseSizeLimitOutput(stdout + stderr, packageName);
		}

		// If we have results, return them even if exit code is non-zero
		// This allows us to use size data from failed checks for baseline comparison
		if (results.length > 0) {
			if (exitCode !== 0) {
				console.log(
					`⚠️ size-limit failed for ${packageName} (exit code: ${exitCode}), but extracted ${results.length} result(s) for baseline comparison`,
				);
				// Log the results for debugging
				for (const result of results) {
					console.log(
						`  - ${result.package}:${result.file}: ${result.size} (limit: ${result.limit}, status: ${result.status})`,
					);
				}
			}
			return results;
		}

		// If we have no results and exit code is non-zero, log the error
		if (exitCode !== 0) {
			console.log(
				`⚠️ size-limit failed for ${packageName}: ${stderr || stdout}`,
			);
		}

		return [];
	} catch (error) {
		// Restore original package.json on error
		try {
			await import("node:fs/promises").then((fs) =>
				fs.copyFile(originalPackageJsonPath, packageJsonPath),
			);
		} catch {
			// Ignore restore errors
		}

		console.log(
			`⚠️ Error running size-limit on ${packageName}: ${error instanceof Error ? error.message : String(error)}`,
		);
		return [];
	}
};
