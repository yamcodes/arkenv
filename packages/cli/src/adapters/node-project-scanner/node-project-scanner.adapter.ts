import fsp from "node:fs/promises";
import path from "node:path";
import { parse } from "jsonc-parser";
import type { ParsedTsConfig, ProjectScannerPort } from "@/shared/ports";

export class NodeProjectScannerAdapter implements ProjectScannerPort {
	async findTsConfig(startDir = process.cwd()): Promise<string | null> {
		const filenames = [
			"tsconfig.app.json",
			"tsconfig.json",
			"tsconfig.base.json",
			"tsconfig.node.json",
		];
		let currentDir = startDir;

		while (currentDir !== path.parse(currentDir).root) {
			for (const file of filenames) {
				const fullPath = path.join(currentDir, file);
				try {
					await fsp.access(fullPath);
					return fullPath;
				} catch {
					// intentionally ignore missing file
				}
			}
			currentDir = path.dirname(currentDir);
		}
		return null;
	}

	async loadTsConfig(configPath: string): Promise<ParsedTsConfig> {
		let content = "";
		try {
			content = await fsp.readFile(configPath, "utf-8");
		} catch {
			return { path: configPath, compilerOptions: {} };
		}

		const parsed = parse(content) || {};
		const compilerOptions = parsed.compilerOptions || {};

		let mergedCompilerOptions: Record<string, any> = {};

		if (parsed.extends) {
			const extendsArr = Array.isArray(parsed.extends)
				? parsed.extends
				: [parsed.extends];
			for (const ext of extendsArr) {
				let extPath: string;
				if (ext.startsWith(".") || path.isAbsolute(ext)) {
					extPath = path.resolve(path.dirname(configPath), ext);
				} else {
					try {
						extPath = require.resolve(ext, { paths: [path.dirname(configPath)] });
					} catch {
						extPath = path.resolve(path.dirname(configPath), "node_modules", ext);
					}
				}

				const baseConfig = await this.loadTsConfig(extPath);
				const baseOptions = { ...baseConfig.compilerOptions };

				// Resolve base baseUrl and rootDir relative to extPath
				if (baseOptions.baseUrl) {
					baseOptions.baseUrl = path.resolve(
						path.dirname(extPath),
						baseOptions.baseUrl,
					);
				}
				if (baseOptions.rootDir) {
					baseOptions.rootDir = path.resolve(
						path.dirname(extPath),
						baseOptions.rootDir,
					);
				}

				mergedCompilerOptions = { ...mergedCompilerOptions, ...baseOptions };
			}
		}

		// Resolve current baseUrl and rootDir relative to configPath
		const currentOptions = { ...compilerOptions };
		if (currentOptions.baseUrl) {
			currentOptions.baseUrl = path.resolve(
				path.dirname(configPath),
				currentOptions.baseUrl,
			);
		}
		if (currentOptions.rootDir) {
			currentOptions.rootDir = path.resolve(
				path.dirname(configPath),
				currentOptions.rootDir,
			);
		}

		mergedCompilerOptions = { ...mergedCompilerOptions, ...currentOptions };

		return {
			...parsed,
			path: configPath,
			compilerOptions: mergedCompilerOptions,
		};
	}

	private resolveImportPath(
		importSpecifier: string,
		tsConfig: ParsedTsConfig,
		currentFilePath: string,
	): string | null {
		if (importSpecifier.startsWith(".")) {
			return path.resolve(path.dirname(currentFilePath), importSpecifier);
		}
		if (path.isAbsolute(importSpecifier)) {
			return importSpecifier;
		}

		const compilerOptions = tsConfig.compilerOptions || {};
		const baseUrl = compilerOptions.baseUrl || path.dirname(tsConfig.path);
		const paths = compilerOptions.paths || {};

		for (const [pattern, targets] of Object.entries(paths)) {
			const cleanPattern = pattern.replace(/\*$/, "");
			if (importSpecifier.startsWith(cleanPattern)) {
				const subpath = importSpecifier.slice(cleanPattern.length);
				for (const target of targets) {
					const cleanTarget = target.replace(/\*$/, "");
					const targetRel = `${cleanTarget}${subpath}`;
					return path.resolve(baseUrl, targetRel);
				}
			}
		}

		if (compilerOptions.baseUrl) {
			return path.resolve(baseUrl, importSpecifier);
		}

		return null;
	}

	private async walk(dir: string, fileList: string[] = []): Promise<string[]> {
		try {
			const entries = await fsp.readdir(dir, { withFileTypes: true });
			for (const entry of entries) {
				if (entry.isDirectory()) {
					const name = entry.name;
					if (
						name === "node_modules" ||
						name === "dist" ||
						name === "build" ||
						name === ".git" ||
						name === ".turbo" ||
						name === "scratch"
					) {
						continue;
					}
					await this.walk(path.join(dir, name), fileList);
				} else if (entry.isFile()) {
					if (
						/\.(ts|tsx|js|jsx)$/.test(entry.name) &&
						!entry.name.endsWith(".d.ts")
					) {
						fileList.push(path.join(dir, entry.name));
					}
				}
			}
		} catch {
			// ignore inaccessible directories
		}
		return fileList;
	}

	private parseEnvExample(content: string): string[] {
		const keys: string[] = [];
		const lines = content.split(/\r?\n/);

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;

			const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=/i);
			if (match?.[1]) {
				keys.push(match[1]);
			}
		}

		return Array.from(new Set(keys));
	}

	private async scanProjectEnvKeys(
		cwd: string,
		tsConfig?: ParsedTsConfig | null,
		envConfigPath?: string,
	): Promise<string[]> {
		const keys: string[] = [];
		const files = await this.walk(cwd);

		const cleanEnvConfigPath = envConfigPath
			? envConfigPath.replace(/\.(ts|js|tsx|jsx)$/, "")
			: null;

		for (const file of files) {
			try {
				const content = await fsp.readFile(file, "utf-8");

				// Match process.env.VAR
				const processMatches = content.matchAll(
					/process\.env\.([A-Z_][A-Z0-9_]*)/g,
				);
				for (const m of processMatches) {
					if (m[1]) keys.push(m[1]);
				}

				// Match import.meta.env.VAR
				const metaMatches = content.matchAll(
					/import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g,
				);
				for (const m of metaMatches) {
					if (m[1]) keys.push(m[1]);
				}

				// Check for alias or relative import of envConfigPath
				if (cleanEnvConfigPath) {
					const importMatches = content.matchAll(
						/import\s+[^;]*from\s+['"]([^'"]+)['"]/g,
					);
					for (const m of importMatches) {
						const importPath = m[1];
						let resolvedPath: string | null = null;
						if (tsConfig) {
							resolvedPath = this.resolveImportPath(importPath, tsConfig, file);
						} else if (importPath.startsWith(".")) {
							resolvedPath = path.resolve(path.dirname(file), importPath);
						}

						if (
							resolvedPath &&
							resolvedPath.replace(/\.(ts|js|tsx|jsx)$/, "") ===
								cleanEnvConfigPath
						) {
							// This file imports the env object, scan for env.VAR usages
							const envMatches = content.matchAll(/\benv\.([A-Z_][A-Z0-9_]*)/g);
							for (const em of envMatches) {
								if (em[1]) keys.push(em[1]);
							}
						}
					}
				}
			} catch {
				// ignore unreadable files
			}
		}

		return Array.from(new Set(keys));
	}

	async getEnvExampleKeys(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
		envConfigPath?: string,
	): Promise<{ keys: string[]; source: ".env.example" | "project" } | null> {
		const filePath = path.join(cwd, ".env.example");
		try {
			const content = await fsp.readFile(filePath, "utf-8");
			const keys = this.parseEnvExample(content);
			if (keys.length > 0) {
				return { keys, source: ".env.example" };
			}
		} catch {
			// .env.example not found or unreadable
		}

		// Fallback to scanning project files
		const projectKeys = await this.scanProjectEnvKeys(cwd, tsConfig, envConfigPath);
		if (projectKeys.length > 0) {
			return { keys: projectKeys, source: "project" };
		}

		return null;
	}

	async suggestDefaultEnvPath(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
	): Promise<string> {
		let currentTsConfig = tsConfig;
		if (!currentTsConfig) {
			const tsConfigPath = await this.findTsConfig(cwd);
			if (tsConfigPath) {
				currentTsConfig = await this.loadTsConfig(tsConfigPath);
			}
		}

		if (currentTsConfig?.compilerOptions?.rootDir) {
			const rootDir = currentTsConfig.compilerOptions.rootDir;
			const rel = path.relative(cwd, rootDir);
			if (!rel || rel === ".") return "./env.ts";
			return `./${rel}/env.ts`;
		}

		try {
			await fsp.access(path.join(cwd, "src"));
			return "./src/env.ts";
		} catch {
			return "./env.ts";
		}
	}
	async checkTsConfig(cwd = process.cwd()): Promise<{
		status: "strict" | "not_strict" | "not_found";
		file?: string;
		parsed?: ParsedTsConfig;
	}> {
		const tsConfigPath = await this.findTsConfig(cwd);
		if (!tsConfigPath) return { status: "not_found" };
		const fileName = path.basename(tsConfigPath);

		try {
			const parsed = await this.loadTsConfig(tsConfigPath);
			if (parsed?.compilerOptions?.strict === true) {
				return { status: "strict", file: fileName, parsed };
			}
			return { status: "not_strict", file: fileName, parsed };
		} catch {
			return { status: "not_found" };
		}
	}

	async detectFramework(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
	): Promise<"vite" | "bun" | "node"> {
		if (tsConfig?.compilerOptions?.types) {
			const types = tsConfig.compilerOptions.types;
			if (types.includes("vite") || types.includes("vite/client")) return "vite";
			if (types.includes("bun") || types.includes("@types/bun")) return "bun";
		}

		try {
			const pkgJsonPath = path.join(cwd, "package.json");
			const content = await fsp.readFile(pkgJsonPath, "utf-8");
			const pkg = JSON.parse(content);
			const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

			if (allDeps.vite) return "vite";
			if (allDeps["@types/bun"] || allDeps.bun) return "bun";
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

		// Check for bun runtime
		if ("bun" in process.versions) return "bun";

		return "node";
	}

	async detectPackageManager(
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
}
