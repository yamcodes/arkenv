import type { ProjectOptions } from "./prompts";

export type ScaffoldingPlan = {
	/** Files to be created or modified */
	files: {
		path: string;
		content: string;
		action: "create" | "overwrite" | "append";
		label?: string;
	}[];
	/** TypeScript configuration updates */
	tsConfig?: {
		path: string;
		action: "strict";
	};
	/** Dependencies to install */
	install?: {
		packageManager: "pnpm" | "yarn" | "npm" | "bun";
		dependencies: string[];
	};
	/** Optional skill installation */
	skill?: {
		dlxCommand: string;
		packageName: string;
		isYes: boolean;
	};
	/** Framework-specific bootstrapping */
	bootstrap?: {
		framework: "vite" | "bun";
		path?: string;
		importPath?: string;
	};
	/** Metadata for reporting */
	metadata: {
		displayPath: string;
		framework: string;
		validator: string;
		packageManager: string;
		importPath: string;
	};
};

export type CollectedState = {
	cwd: string;
	options: ProjectOptions;
	detectedFramework: "vite" | "bun" | "node";
	packageManager: "pnpm" | "yarn" | "npm" | "bun";
	tsConfig: {
		status: "strict" | "not_strict" | "not_found";
		file?: string;
	};
	shouldUpdateTsConfig: boolean;
	existingFiles: string[];
	isYes: boolean;
};

export type BootstrapResult = {
	success: boolean;
	updated?: boolean;
	instructions?: string;
	error?: string;
};

export type Workspace = {
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

export type Reporter = {
	spinner(): { start(msg: string): void; stop(msg: string): void };
	step(msg: string): void;
	info(msg: string): void;
	warn(msg: string): void;
	error(msg: string): void;
	note(msg: string, title?: string): void;
	finish(msg: string, meta: any): void;
};
