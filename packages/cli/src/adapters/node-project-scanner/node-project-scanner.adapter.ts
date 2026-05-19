import type {
	ParsedTsConfig,
	ProjectScannerPort,
	RequirementCheckResult,
} from "@/shared/ports";
import {
	detectBunFeatures,
	detectFramework,
	detectPackageManager,
	suggestDefaultEnvPath,
} from "./utils/detector";
import { getEnvExampleKeys } from "./utils/env-scanner";
import { checkRequirements } from "./utils/requirements";
import { checkTsConfig, findTsConfig, loadTsConfig } from "./utils/tsconfig";

/**
 * Adapter implementation for ProjectScannerPort using Node.js APIs.
 */
export class NodeProjectScannerAdapter implements ProjectScannerPort {
	async findTsConfig(startDir = process.cwd()): Promise<string | null> {
		return findTsConfig(startDir);
	}

	async loadTsConfig(
		configPath: string,
		visited = new Set<string>(),
	): Promise<ParsedTsConfig> {
		return loadTsConfig(configPath, visited);
	}

	async getEnvExampleKeys(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
		envConfigPath?: string,
	): Promise<{ keys: string[]; source: ".env.example" | "project" } | null> {
		return getEnvExampleKeys(cwd, tsConfig, envConfigPath);
	}

	async suggestDefaultEnvPath(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
	): Promise<string> {
		return suggestDefaultEnvPath(cwd, tsConfig);
	}

	async checkTsConfig(cwd = process.cwd()): Promise<{
		status: "strict" | "not_strict" | "not_found";
		file?: string;
		parsed?: ParsedTsConfig;
	}> {
		return checkTsConfig(cwd);
	}

	async checkRequirements(
		cwd = process.cwd(),
	): Promise<RequirementCheckResult[]> {
		return checkRequirements(cwd);
	}

	async detectFramework(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
	): Promise<"vite" | "bun-fullstack" | "vanilla"> {
		return detectFramework(cwd, tsConfig);
	}

	async detectBunFeatures(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
	): Promise<("serve" | "build")[]> {
		return detectBunFeatures(cwd, tsConfig);
	}

	async detectPackageManager(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
	): Promise<"pnpm" | "yarn" | "npm" | "bun"> {
		return detectPackageManager(cwd, tsConfig);
	}
}
