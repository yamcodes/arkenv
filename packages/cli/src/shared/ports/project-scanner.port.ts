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

export type ProjectScannerPort = {
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
	): Promise<"vite" | "bun" | "node">;
	detectPackageManager(
		cwd?: string,
		tsConfig?: ParsedTsConfig | null,
	): Promise<"pnpm" | "yarn" | "npm" | "bun">;
};
