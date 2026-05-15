/**
 * Represents the result of a configuration bootstrap operation.
 */
export type BootstrapResult = {
	success: boolean;
	updated?: boolean | undefined;
	instructions?: string | undefined;
	error?: string | undefined;
};

/**
 * Port interface for interacting with the user's workspace/file system.
 */
export type WorkspacePort = {
	exists(path: string): Promise<boolean>;
	readFile(path: string): Promise<string>;
	writeFile(path: string, content: string): Promise<void>;
	mkdir(path: string, recursive?: boolean): Promise<void>;
	execute(command: string, args?: string[]): Promise<void>;
	updateTsConfigToStrict(path?: string): Promise<{
		status: "updated" | "already_strict" | "not_found" | "error";
		file?: string;
	}>;
	findViteConfig(): Promise<string | null>;
	findBunConfig(): Promise<string | null>;
	bootstrapViteConfig(
		path: string,
		importPath: string,
	): Promise<BootstrapResult>;
	bootstrapBunConfig(path: string): Promise<BootstrapResult>;
	safeAppend(
		path: string,
		schemaPath: string,
		framework: "vite" | "bun",
	): Promise<boolean>;
};
