import fsp from "node:fs/promises";
import path from "node:path";
import type { ParsedTsConfig, ProjectScannerPort } from "@/shared/ports";
import {
	detectBunFeatures,
	detectFramework,
	detectPackageManager,
	suggestDefaultEnvPath,
} from "./utils/detector";
import { getEnvExampleKeys } from "./utils/env-scanner";
import { checkTsConfig, findTsConfig, loadTsConfig } from "./utils/tsconfig";

/**
 * Adapter implementation for ProjectScannerPort using Node.js APIs.
 */
export class NodeProjectScannerAdapter implements ProjectScannerPort {
	/**
	 * Reports whether a directory has no entries, treating unreadable directories as not empty.
	 */
	async isEmptyDirectory(dir = process.cwd()): Promise<boolean> {
		try {
			const files = await fsp.readdir(dir);
			return files.length === 0;
		} catch {
			return false;
		}
	}

	/**
	 * Reports whether a directory contains a package manifest.
	 */
	async hasPackageJson(dir = process.cwd()): Promise<boolean> {
		try {
			await fsp.access(path.join(dir, "package.json"));
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Finds the nearest TypeScript config starting from the provided directory.
	 */
	async findTsConfig(startDir = process.cwd()): Promise<string | null> {
		return findTsConfig(startDir);
	}

	/**
	 * Loads and parses a TypeScript config, including any inherited configs.
	 */
	async loadTsConfig(
		configPath: string,
		visited = new Set<string>(),
	): Promise<ParsedTsConfig> {
		return loadTsConfig(configPath, visited);
	}

	/**
	 * Discovers environment keys from `.env.example` or existing project usage.
	 */
	async getEnvExampleKeys(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
		envConfigPath?: string,
	): Promise<{ keys: string[]; source: ".env.example" | "project" } | null> {
		return getEnvExampleKeys(cwd, tsConfig, envConfigPath);
	}

	/**
	 * Suggests the most likely environment schema path for the project.
	 */
	async suggestDefaultEnvPath(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
	): Promise<string> {
		return suggestDefaultEnvPath(cwd, tsConfig);
	}

	/**
	 * Checks whether the project TypeScript config already satisfies ArkEnv requirements.
	 */
	async checkTsConfig(cwd = process.cwd()): Promise<{
		status: "strict" | "not_strict" | "not_found";
		file?: string;
		parsed?: ParsedTsConfig;
	}> {
		return checkTsConfig(cwd);
	}

	/**
	 * Detects the framework integration that best matches the project.
	 */
	async detectFramework(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
	): Promise<"vite" | "bun-fullstack" | "vanilla"> {
		return detectFramework(cwd, tsConfig);
	}

	/**
	 * Detects which Bun browser bundling entry points are present.
	 */
	async detectBunFeatures(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
	): Promise<("serve" | "build")[]> {
		return detectBunFeatures(cwd, tsConfig);
	}

	/**
	 * Detects the package manager used by the project.
	 */
	async detectPackageManager(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
	): Promise<"pnpm" | "yarn" | "npm" | "bun"> {
		return detectPackageManager(cwd, tsConfig);
	}
}
