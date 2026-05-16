import fsp from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { parse } from "jsonc-parser";
import type { ParsedTsConfig } from "@/shared/ports";

const requireResolve = createRequire(import.meta.url).resolve;

export async function findTsConfig(
	startDir = process.cwd(),
): Promise<string | null> {
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

export async function loadTsConfig(
	configPath: string,
	visited = new Set<string>(),
): Promise<ParsedTsConfig> {
	const absConfigPath = path.resolve(configPath);
	if (visited.has(absConfigPath)) {
		throw new Error(
			`Circular extends dependency detected in tsconfig.json: ${absConfigPath}`,
		);
	}
	visited.add(absConfigPath);

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
					extPath = requireResolve(ext, {
						paths: [path.dirname(configPath)],
					});
				} catch {
					extPath = path.resolve(path.dirname(configPath), "node_modules", ext);
				}
			}

			const baseConfig = await loadTsConfig(extPath, visited);
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

export async function checkTsConfig(cwd = process.cwd()): Promise<{
	status: "strict" | "not_strict" | "not_found";
	file?: string;
	parsed?: ParsedTsConfig;
}> {
	const tsConfigPath = await findTsConfig(cwd);
	if (!tsConfigPath) return { status: "not_found" };
	const fileName = path.basename(tsConfigPath);

	try {
		const parsed = await loadTsConfig(tsConfigPath);
		if (parsed?.compilerOptions?.strict === true) {
			return { status: "strict", file: fileName, parsed };
		}
		return { status: "not_strict", file: fileName, parsed };
	} catch {
		return { status: "not_found" };
	}
}
