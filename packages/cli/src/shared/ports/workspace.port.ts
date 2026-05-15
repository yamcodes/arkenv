import type { BootstrapResult } from "../../features/scaffold/plan";

export type WorkspacePort = {
	exists(path: string): Promise<boolean>;
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
