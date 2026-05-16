import fs from "node:fs/promises";
import path from "node:path";
import { type ParsedTsConfig, resolveImportPath } from "./tsconfig-parser";

/**
 * Extracts environment variable keys from a .env.example file.
 * It uses a regex to find keys, ignoring comments and values.
 */
export function parseEnvExample(content: string): string[] {
	const keys: string[] = [];
	const lines = content.split(/\r?\n/);

	for (const line of lines) {
		const trimmed = line.trim();
		// Skip empty lines or comments
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}

		// Regex to match environment variable keys (e.g., KEY=VALUE or KEY=)
		// Matches standard env var naming: starts with letter/underscore, followed by letters/numbers/underscores.
		const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=/i);
		if (match?.[1]) {
			keys.push(match[1]);
		}
	}

	return Array.from(new Set(keys)); // Ensure unique keys
}

async function walk(dir: string, fileList: string[] = []): Promise<string[]> {
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });
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

/**
 * Scans project source files to detect environment variables used in code,
 * respecting alias imports and standard patterns.
 */
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
			const content = await fs.readFile(file, "utf-8");

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
						resolvedPath = resolveImportPath(importPath, tsConfig, file);
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

/**
 * Attempts to read .env.example or scan project files to extract env keys.
 */
export async function getEnvExampleKeys(
	cwd = process.cwd(),
	tsConfig?: ParsedTsConfig | null,
	envConfigPath?: string,
): Promise<{ keys: string[]; source: ".env.example" | "project" } | null> {
	const filePath = path.join(cwd, ".env.example");
	try {
		const content = await fs.readFile(filePath, "utf-8");
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
