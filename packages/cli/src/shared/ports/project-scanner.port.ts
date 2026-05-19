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

export type RequirementCheckResult = {
	status: "pass" | "warn" | "fail";
	requirement: string;
	message: string;
	current?: string;
	expected?: string;
};

export type ProjectScannerPort = {
	isEmptyDirectory(dir?: string): Promise<boolean>;
	hasPackageJson(dir?: string): Promise<boolean>;
	findTsConfig(startDir?: string): Promise<string | null>;
	loadTsConfig(configPath: string): Promise<ParsedTsConfig>;
	getEnvExampleKeys(
		cwd?: string,
		tsConfig?: ParsedTsConfig | null,
		envConfigPath?: string,
	): Promise<{ keys: string[]; source: ".env.example" | "project" } | null>;
	suggestDefaultEnvPath(
		cwd?: string,
		tsConfig?: ParsedTsConfig | null,
	): Promise<string>;
	checkTsConfig(cwd?: string): Promise<{
		status: "strict" | "not_strict" | "not_found";
		file?: string;
		parsed?: ParsedTsConfig;
	}>;
	detectFramework(
		cwd?: string,
		tsConfig?: ParsedTsConfig | null,
	): Promise<"vite" | "bun-fullstack" | "vanilla">;
	detectBunFeatures(
		cwd?: string,
		tsConfig?: ParsedTsConfig | null,
	): Promise<("serve" | "build")[]>;
	detectPackageManager(
		cwd?: string,
		tsConfig?: ParsedTsConfig | null,
	): Promise<"pnpm" | "yarn" | "npm" | "bun">;
};
