import fsp from "node:fs/promises";
import path from "node:path";
import { parse } from "jsonc-parser";

export type ParsedTsConfig = {
	path: string;
	compilerOptions: {
		strict?: boolean;
		rootDir?: string;
		baseUrl?: string;
		paths?: Record<string, string[]>;
		[key: string]: any;
	};
	[key: string]: any;
};

/**
 * Finds the nearest tsconfig file starting from startDir up to the root directory.
 */
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

/**
 * Recursively loads and parses a tsconfig file, resolving extends and merging compilerOptions.
 */
export async function loadTsConfig(
	configPath: string,
): Promise<ParsedTsConfig> {
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

			const baseConfig = await loadTsConfig(extPath);
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

/**
 * Resolves an import specifier (e.g. "@/env") to an absolute file path without extension.
 */
export function resolveImportPath(
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
