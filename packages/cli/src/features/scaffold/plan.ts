import type { LoggerPort as Reporter } from "@/shared/ports/logger.port";
import type { WorkspacePort as Workspace } from "@/shared/ports/workspace.port";

export type { Reporter, Workspace };

export type ProjectOptions = {
	path: string;
	validator: "arktype" | "zod" | "valibot";
	framework: "vite" | "bun" | "node";
	language: "ts"; // TODO: Support JS
	overwriteEnvSchemaFile?: boolean | undefined;
	envDtsHandling?: "overwrite" | "append" | "skip" | undefined;
	installTypeDefinitions?: boolean | undefined;
	envKeys?: string[] | undefined;
	installSkill?: boolean | undefined;
};

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
