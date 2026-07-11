import { execSync } from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import type {
	LoggerPort,
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
	constructor(private logger?: Pick<LoggerPort, "log">) {}
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
	 * Checks technical requirements for the project.
	 */
	async checkRequirements(
		cwd = process.cwd(),
	): Promise<RequirementCheckResult[]> {
		return checkRequirements(cwd);
	}

	/**
	 * Detects the framework integration that best matches the project.
	 */
	async detectFramework(
		cwd = process.cwd(),
		tsConfig?: ParsedTsConfig | null,
	): Promise<"vite" | "bun-fullstack" | "vanilla" | "nextjs" | "nuxt"> {
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

	/**
	 * Detects whether the arkenv skill is already installed.
	 */
	async hasSkill(cwd = process.cwd()): Promise<boolean> {
		try {
			const skillsLockPath = path.join(cwd, "skills-lock.json");
			const content = await fsp.readFile(skillsLockPath, "utf-8");
			const parsed = JSON.parse(content);
			if (
				parsed &&
				typeof parsed === "object" &&
				parsed.skills &&
				typeof parsed.skills === "object"
			) {
				if ("arkenv" in parsed.skills) {
					return true;
				}
			}
		} catch {
			// ignore missing or malformed skills-lock.json
		}

		const skillPaths = [
			"skills/arkenv/SKILL.md",
			".agent/skills/arkenv/SKILL.md",
			".agents/skills/arkenv/SKILL.md",
		];
		for (const relativePath of skillPaths) {
			try {
				await fsp.access(path.join(cwd, relativePath));
				return true;
			} catch {
				// ignore path not accessible
			}
		}

		return false;
	}

	/**
	 * Check the Git working tree status in the target directory.
	 *
	 * @param cwd The directory to check for Git status
	 * @returns An object indicating whether the working tree is clean, dirty, not a repo, or unknown
	 */
	async checkGitStatus(
		cwd = process.cwd(),
	): Promise<{ status: "clean" | "dirty" | "not_a_repo" | "unknown" }> {
		try {
			const stdout = execSync("git status --porcelain", {
				cwd,
				encoding: "utf-8",
			});
			return stdout.trim().length === 0
				? { status: "clean" }
				: { status: "dirty" };
		} catch (error) {
			const err = error as { code?: string; stderr?: string };
			if (err.code === "ENOENT") {
				this.logger?.log(
					"Git is not installed on this system. Skipping git status check.",
				);
				return { status: "not_a_repo" };
			}
			if (
				typeof err.stderr === "string" &&
				err.stderr.includes("not a git repository")
			) {
				return { status: "not_a_repo" };
			}
			return { status: "unknown" };
		}
	}
}
