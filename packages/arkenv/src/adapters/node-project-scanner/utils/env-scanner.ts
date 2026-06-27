import fsp from "node:fs/promises";
import path from "node:path";
import type { ParsedTsConfig } from "@/shared/ports";

export async function walk(
	dir: string,
	fileList: string[] = [],
): Promise<string[]> {
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
				await walk(path.join(dir, name), fileList);
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

export function parseEnvExample(content: string): string[] {
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

export function resolveImportPaths(
	importSpecifier: string,
	tsConfig: ParsedTsConfig,
	currentFilePath: string,
): string[] {
	if (importSpecifier.startsWith(".")) {
		return [path.resolve(path.dirname(currentFilePath), importSpecifier)];
	}
	if (path.isAbsolute(importSpecifier)) {
		return [importSpecifier];
	}

	const compilerOptions = tsConfig.compilerOptions || {};
	const baseUrl = compilerOptions.baseUrl || path.dirname(tsConfig.path);
	const paths = compilerOptions.paths || {};

	const matches: {
		cleanPattern: string;
		targets: string[];
		hadStar: boolean;
	}[] = [];
	for (const [pattern, targets] of Object.entries(paths)) {
		const hadStar = pattern.endsWith("*");
		const cleanPattern = pattern.replace(/\*$/, "");
		matches.push({
			cleanPattern,
			targets: Array.isArray(targets) ? targets : [targets],
			hadStar,
		});
	}

	matches.sort((a, b) => b.cleanPattern.length - a.cleanPattern.length);

	for (const { cleanPattern, targets, hadStar } of matches) {
		if (
			(hadStar && importSpecifier.startsWith(cleanPattern)) ||
			(!hadStar && importSpecifier === cleanPattern)
		) {
			const subpath = importSpecifier.slice(cleanPattern.length);
			return targets.map((target) => {
				const cleanTarget = target.replace(/\*$/, "");
				const targetRel = `${cleanTarget}${subpath}`;
				return path.resolve(baseUrl, targetRel);
			});
		}
	}

	if (compilerOptions.baseUrl) {
		return [path.resolve(baseUrl, importSpecifier)];
	}

	return [];
}

export async function scanProjectEnvKeys(
	cwd: string,
	tsConfig?: ParsedTsConfig | null,
	envConfigPath?: string,
): Promise<string[]> {
	const keys: string[] = [];
	const files = await walk(cwd);

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
					let resolvedPaths: string[] = [];
					if (tsConfig) {
						resolvedPaths = resolveImportPaths(importPath, tsConfig, file);
					} else if (importPath.startsWith(".")) {
						resolvedPaths = [path.resolve(path.dirname(file), importPath)];
					}

					if (
						resolvedPaths.some(
							(p) => p.replace(/\.(ts|js|tsx|jsx)$/, "") === cleanEnvConfigPath,
						)
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

export async function getEnvExampleKeys(
	cwd = process.cwd(),
	tsConfig?: ParsedTsConfig | null,
	envConfigPath?: string,
): Promise<{ keys: string[]; source: ".env.example" | "project" } | null> {
	const filePath = path.join(cwd, ".env.example");
	try {
		const content = await fsp.readFile(filePath, "utf-8");
		const keys = parseEnvExample(content);
		if (keys.length > 0) {
			return { keys, source: ".env.example" };
		}
	} catch {
		// .env.example not found or unreadable
	}

	// Fallback to scanning project files
	const projectKeys = await scanProjectEnvKeys(cwd, tsConfig, envConfigPath);
	if (projectKeys.length > 0) {
		return { keys: projectKeys, source: "project" };
	}

	return null;
}
