export type ParsedTsConfig = {
	path: string;
	compilerOptions: {
		strict?: boolean;
		module?: string;
		moduleResolution?: string;
		rootDir?: string;
		baseUrl?: string;
		paths?: Record<string, string[]>;
		[key: string]: any;
	};
	[key: string]: any;
};

/**
 * Represents the result of a single technical requirement check (e.g. Node.js version, TypeScript config).
 */
export type RequirementCheckResult = {
	status: "pass" | "warn" | "fail";
	requirement: string;
	message: string;
	current?: string;
	expected?: string;
};

export type ProjectScannerPort = {
	/**
	 * Reports whether a directory has no entries.
	 */
	isEmptyDirectory(dir?: string): Promise<boolean>;
	/**
	 * Reports whether a directory contains `package.json`.
	 */
	hasPackageJson(dir?: string): Promise<boolean>;
	/**
	 * Finds the nearest TypeScript config from a starting directory.
	 */
	findTsConfig(startDir?: string): Promise<string | null>;
	/**
	 * Loads and parses a TypeScript config file.
	 */
	loadTsConfig(configPath: string): Promise<ParsedTsConfig>;
	/**
	 * Discovers environment keys from `.env.example` or project usage.
	 */
	getEnvExampleKeys(
		cwd?: string,
		tsConfig?: ParsedTsConfig | null,
		envConfigPath?: string,
	): Promise<{ keys: string[]; source: ".env.example" | "project" } | null>;
	/**
	 * Suggests the default path for the generated environment schema.
	 */
	suggestDefaultEnvPath(
		cwd?: string,
		tsConfig?: ParsedTsConfig | null,
	): Promise<string>;
	/**
	 * Checks whether the project TypeScript config exists and enables strict mode.
	 */
	checkTsConfig(cwd?: string): Promise<{
		status: "strict" | "not_strict" | "not_found";
		file?: string;
		parsed?: ParsedTsConfig;
	}>;
	/**
	 * Checks technical requirements for the project.
	 */
	checkRequirements(cwd?: string): Promise<RequirementCheckResult[]>;
	/**
	 * Detects the most likely runtime or bundler integration.
	 */
	detectFramework(
		cwd?: string,
		tsConfig?: ParsedTsConfig | null,
	): Promise<"vite" | "bun-fullstack" | "vanilla" | "nextjs">;
	/**
	 * Detects which Bun browser bundling entry points are present.
	 */
	detectBunFeatures(
		cwd?: string,
		tsConfig?: ParsedTsConfig | null,
	): Promise<("serve" | "build")[]>;
	/**
	 * Detects the project package manager.
	 */
	detectPackageManager(
		cwd?: string,
		tsConfig?: ParsedTsConfig | null,
	): Promise<"pnpm" | "yarn" | "npm" | "bun">;
};
