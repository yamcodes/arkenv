import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "bun";

// Helper function to get filename from size-limit config in package.json
export const getFilenameFromConfig = (packageName: string): string | null => {
	try {
		// Try to find package.json for this package
		// Package name could be "arkenv" or "./packages/arkenv" or "packages/arkenv"
		let packagePath = packageName;
		if (packagePath.startsWith("./")) {
			packagePath = packagePath.slice(2);
		}
		if (!packagePath.startsWith("packages/")) {
			packagePath = `packages/${packagePath}`;
		}

		const packageJsonPath = join(process.cwd(), packagePath, "package.json");
		const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
		const sizeLimitConfig = packageJson["size-limit"];

		if (Array.isArray(sizeLimitConfig) && sizeLimitConfig.length > 0) {
			const firstConfig = sizeLimitConfig[0];
			if (firstConfig.path) {
				// Extract filename from path (e.g., "dist/index.js" -> "index.js")
				const pathParts = firstConfig.path.split("/");
				return pathParts[pathParts.length - 1] || null;
			}
		}
	} catch {
		// If we can't read the config, return null
	}
	return null;
};

// Function to get package names from filter
export const getPackageNames = (filter: string): string[] => {
	const packages: string[] = [];

	// If filter is a wildcard, discover packages from packages directory
	if (filter.includes("*")) {
		try {
			const packagesDir = join(process.cwd(), "packages");
			if (existsSync(packagesDir)) {
				const entries = readdirSync(packagesDir, { withFileTypes: true });
				for (const entry of entries) {
					if (entry.isDirectory()) {
						const packageJsonPath = join(
							packagesDir,
							entry.name,
							"package.json",
						);
						if (existsSync(packageJsonPath)) {
							const packageJson = JSON.parse(
								readFileSync(packageJsonPath, "utf-8"),
							);
							if (packageJson.name) {
								packages.push(packageJson.name);
							}
						}
					}
				}
			}
		} catch (error) {
			console.log(
				`⚠️ Failed to discover packages: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	} else {
		// Extract package name from filter like "./packages/arkenv"
		const match = filter.match(/packages\/([@a-z0-9][@a-z0-9/_-]*)/i);
		if (match?.[1]) {
			// Try to read package.json to get the actual package name
			const packageJsonPath = join(
				process.cwd(),
				"packages",
				match[1],
				"package.json",
			);
			if (existsSync(packageJsonPath)) {
				try {
					const packageJson = JSON.parse(
						readFileSync(packageJsonPath, "utf-8"),
					);
					if (packageJson.name) {
						packages.push(packageJson.name);
					} else {
						packages.push(match[1]);
					}
				} catch {
					packages.push(match[1]);
				}
			} else {
				packages.push(match[1]);
			}
		}
	}

	return packages.length > 0 ? packages : [];
};

// Function to get changed packages based on git diff
export const getChangedPackages = async (
	baseBranch: string,
): Promise<Set<string>> => {
	const changedPackages = new Set<string>();

	try {
		// First, ensure we have the base branch fetched
		// Try to fetch it if it's not available
		const fetchProc = spawn(["git", "fetch", "origin", baseBranch], {
			stdout: "pipe",
			stderr: "pipe",
		});
		await fetchProc.exited; // Don't fail if fetch fails, just continue

		// Get list of changed files between base and HEAD
		// Use three-dot diff to get files changed in HEAD compared to base
		const diffProc = spawn(
			["git", "diff", "--name-only", `origin/${baseBranch}...HEAD`],
			{
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		const [stdout, stderr] = await Promise.all([
			new Response(diffProc.stdout).text(),
			new Response(diffProc.stderr).text(),
		]);

		const exitCode = await diffProc.exited;
		if (exitCode !== 0) {
			console.log(
				`⚠️ Failed to get changed files: ${stderr || stdout}. Falling back to checking all packages.`,
			);
			return changedPackages;
		}

		const changedFiles = stdout
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		// Map changed files to packages
		for (const file of changedFiles) {
			// Check if file is in packages directory
			const packagesMatch = file.match(/^packages\/([@a-z0-9][@a-z0-9/_-]*)\//i);
			if (packagesMatch?.[1]) {
				const packageDir = packagesMatch[1];

				// Get actual package name from package.json
				const packageJsonPath = join(
					process.cwd(),
					"packages",
					packageDir,
					"package.json",
				);
				if (existsSync(packageJsonPath)) {
					try {
						const packageJson = JSON.parse(
							readFileSync(packageJsonPath, "utf-8"),
						);
						if (packageJson.name) {
							changedPackages.add(packageJson.name);
						} else {
							changedPackages.add(packageDir);
						}
					} catch {
						changedPackages.add(packageDir);
					}
				} else {
					changedPackages.add(packageDir);
				}
			}
		}

		if (changedPackages.size > 0) {
			console.log(
				`📦 Detected changed packages: ${Array.from(changedPackages).join(", ")}`,
			);
		} else {
			console.log("📦 No packages changed in this PR");
		}
	} catch (error) {
		console.log(
			`⚠️ Error detecting changed packages: ${error instanceof Error ? error.message : String(error)}. Falling back to checking all packages.`,
		);
	}

	return changedPackages;
};
