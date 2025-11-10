import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
