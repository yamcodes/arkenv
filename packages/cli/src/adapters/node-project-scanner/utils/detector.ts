import fsp from "node:fs/promises";
import path from "node:path";
import type { ParsedTsConfig } from "@/shared/ports";

export async function detectFramework(
	cwd = process.cwd(),
	tsConfig?: ParsedTsConfig | null,
): Promise<"vite" | "bun-fullstack" | "vanilla" | "nextjs"> {
	if (tsConfig?.compilerOptions?.types) {
		const types = tsConfig.compilerOptions.types;
		if (types.includes("vite") || types.includes("vite/client")) return "vite";
	}

	try {
		const pkgJsonPath = path.join(cwd, "package.json");
		const content = await fsp.readFile(pkgJsonPath, "utf-8");
		const pkg = JSON.parse(content);
		const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

		if (allDeps.vite) return "vite";
		if (allDeps.next) return "nextjs";
	} catch {
		// ignore missing or invalid package.json
	}

	// Check for config files
	try {
		await fsp.access(path.join(cwd, "vite.config.ts"));
		return "vite";
	} catch {
		// vite.config.ts not found
	}
	try {
		await fsp.access(path.join(cwd, "vite.config.js"));
		return "vite";
	} catch {
		// vite.config.js not found
	}

	try {
		await fsp.access(path.join(cwd, "next.config.ts"));
		return "nextjs";
	} catch {}
	try {
		await fsp.access(path.join(cwd, "next.config.js"));
		return "nextjs";
	} catch {}
	try {
		await fsp.access(path.join(cwd, "next.config.mjs"));
		return "nextjs";
	} catch {}
	try {
		await fsp.access(path.join(cwd, "next.config.cjs"));
		return "nextjs";
	} catch {}

	// Bun Detection
	const features = await detectBunFeatures(cwd, tsConfig);
	if (features.length > 0) return "bun-fullstack";

	return "vanilla";
}

export async function detectBunFeatures(
	cwd = process.cwd(),
	_tsConfig?: ParsedTsConfig | null,
): Promise<("serve" | "build")[]> {
	const features: ("serve" | "build")[] = [];

	// Check bunfig.toml first as it's a high-signal indicator
	try {
		const bunfigPath = path.join(cwd, "bunfig.toml");
		const content = await fsp.readFile(bunfigPath, "utf-8");
		if (content.includes("[serve]") || content.includes("[serve.static]")) {
			features.push("serve");
		}
		// Bun doesn't have a standard [build] section in bunfig.toml yet,
		// but checking for it doesn't hurt.
		if (content.includes("[build]")) {
			features.push("build");
		}
	} catch {
		// ignore missing or unreadable bunfig.toml
	}

	if (features.includes("serve") && features.includes("build")) return features;

	const { walk } = await import("./env-scanner");
	const files = await walk(cwd);
	let foundServe = features.includes("serve");
	let foundBuild = features.includes("build");

	for (const file of files) {
		try {
			const content = await fsp.readFile(file, "utf-8");
			if (
				!foundServe &&
				(content.includes("Bun.serve") || content.includes("serve("))
			) {
				// Crude check for serve import from bun
				if (
					/from\s+['"]bun['"]/.test(content) ||
					content.includes("Bun.serve")
				) {
					foundServe = true;
					features.push("serve");
				}
			}
			if (
				!foundBuild &&
				(content.includes("Bun.build") || content.includes("build("))
			) {
				if (
					/from\s+['"]bun['"]/.test(content) ||
					content.includes("Bun.build")
				) {
					foundBuild = true;
					features.push("build");
				}
			}
			if (foundServe && foundBuild) break;
		} catch {
			// ignore unreadable files
		}
	}

	return features;
}

export async function detectPackageManager(
	cwd = process.cwd(),
	tsConfig?: ParsedTsConfig | null,
): Promise<"pnpm" | "yarn" | "npm" | "bun"> {
	const userAgent = process.env.npm_config_user_agent?.toString() || "";
	if (userAgent.includes("pnpm")) return "pnpm";
	if (userAgent.includes("yarn")) return "yarn";
	if (userAgent.includes("bun")) return "bun";
	if (userAgent.includes("npm")) return "npm";

	let currentDir = tsConfig?.path ? path.dirname(tsConfig.path) : cwd;

	while (currentDir !== path.parse(currentDir).root) {
		try {
			const pkgJsonPath = path.join(currentDir, "package.json");
			const pkgJsonContent = await fsp.readFile(pkgJsonPath, "utf-8");
			const pkgJson = JSON.parse(pkgJsonContent);

			if (pkgJson.packageManager) {
				if (pkgJson.packageManager.startsWith("pnpm")) return "pnpm";
				if (pkgJson.packageManager.startsWith("yarn")) return "yarn";
				if (pkgJson.packageManager.startsWith("bun")) return "bun";
			}
		} catch {
			// ignore missing or invalid package.json in parent directories
		}

		let files: string[] = [];
		try {
			files = await fsp.readdir(currentDir);
		} catch {
			// ignore inaccessible directories
		}

		if (files.includes("pnpm-lock.yaml")) return "pnpm";
		if (files.includes("yarn.lock")) return "yarn";
		if (files.includes("bun.lockb")) return "bun";
		if (files.includes("package-lock.json")) return "npm";

		currentDir = path.dirname(currentDir);
	}

	return "npm";
}

export async function suggestDefaultEnvPath(
	cwd = process.cwd(),
	tsConfig?: ParsedTsConfig | null,
): Promise<string> {
	let currentTsConfig = tsConfig;
	if (!currentTsConfig) {
		const { findTsConfig, loadTsConfig } = await import("./tsconfig");
		const tsConfigPath = await findTsConfig(cwd);
		if (tsConfigPath) {
			currentTsConfig = await loadTsConfig(tsConfigPath);
		}
	}

	if (currentTsConfig?.compilerOptions?.rootDir) {
		const rootDir = currentTsConfig.compilerOptions.rootDir;
		const rel = path.relative(cwd, rootDir);
		if (rel && rel !== "." && !rel.startsWith("..") && !path.isAbsolute(rel)) {
			return `./${rel}/env.ts`;
		}
		return "./env.ts";
	}

	try {
		await fsp.access(path.join(cwd, "src"));
		return "./src/env.ts";
	} catch {
		return "./env.ts";
	}
}
