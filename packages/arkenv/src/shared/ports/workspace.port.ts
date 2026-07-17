/**
 * Represents the result of a configuration bootstrap operation.
 */
export type BootstrapResult =
	| {
			success: true;
			updated?: boolean;
			instructions?: string;
	  }
	| {
			success: false;
			updated?: boolean;
			error: string;
	  };

/**
 * Port interface for basic file system operations.
 */
export type FileSystemPort = {
	exists(path: string): Promise<boolean>;
	readFile(path: string): Promise<string>;
	writeFile(path: string, content: string): Promise<void>;
	mkdir(path: string, recursive?: boolean): Promise<void>;
	/**
	 * Executes a command without a shell (`shell: false`).
	 * For this reason, `command` MUST be strictly the executable name (e.g., "pnpm", not "pnpm dlx")
	 * and any subsequent arguments must be passed in the `args` array.
	 */
	execute(command: string, args?: string[], cwd?: string): Promise<void>;
};

/**
 * Port interface for workspace configuration and framework-specific operations.
 */
export type ConfigPort = {
	updateTsConfigToStrict(path?: string): Promise<{
		status: "updated" | "already_strict" | "not_found" | "error";
		file?: string;
	}>;
	findViteConfig(cwd?: string): Promise<string | null>;
	findBunConfig(cwd?: string): Promise<string | null>;
	findNextjsConfig(cwd?: string): Promise<string | null>;
	findNuxtConfig(cwd?: string): Promise<string | null>;
	bootstrapViteConfig(
		path: string,
		importPath: string,
	): Promise<BootstrapResult>;
	bootstrapBunConfig(
		path: string | null | undefined,
		features?: ("serve" | "build")[],
	): Promise<BootstrapResult>;
	bootstrapNextjsConfig(
		path: string,
		disableCodegen?: boolean,
	): Promise<BootstrapResult>;
	bootstrapNuxtConfig(path: string): Promise<BootstrapResult>;
	safeAppend(
		path: string,
		schemaPath: string,
		framework: "vite" | "bun-fullstack",
	): Promise<boolean>;
};

/**
 * Combined port interface for interacting with the user's workspace.
 * @deprecated Use FileSystemPort or ConfigPort directly where possible.
 */
export type WorkspacePort = FileSystemPort & ConfigPort;
