import type { LoggerPort as Reporter } from "@/shared/ports/logger.port";
import type { WorkspacePort as Workspace } from "@/shared/ports/workspace.port";

export type { Reporter, Workspace };

/**
 * Options chosen by the user or inferred for scaffolding the project.
 */
export type ProjectOptions = {
	path: string;
	validator: "arktype" | "zod" | "valibot";
	framework: "vite" | "bun-fullstack" | "vanilla";
	bunFeatures?: ("serve" | "build")[] | undefined;
	language: "ts"; // TODO: Support JS
	overwriteEnvSchemaFile?: boolean | undefined;
	envDtsHandling?: "overwrite" | "append" | "skip" | undefined;
	installTypeDefinitions?: boolean | undefined;
	envKeys?: string[] | undefined;
	installSkill?: boolean | undefined;
};

/**
 * Represents the complete plan of actions to scaffold ArkEnv.
 */
export type ScaffoldingPlan = {
	/** Files to be created or modified */
	files: {
		path: string;
		content: string;
		action: "create" | "overwrite" | "append";
		label?: string | undefined;
	}[];
	/** TypeScript configuration updates */
	tsConfig?:
		| {
				path: string;
				action: "strict";
		  }
		| undefined;
	/** Dependencies to install */
	install?:
		| {
				packageManager: "pnpm" | "yarn" | "npm" | "bun";
				dependencies: string[];
		  }
		| undefined;
	/** Optional skill installation */
	skill?:
		| {
				dlxCommand: string[];
				packageName: string;
				isYes: boolean;
		  }
		| undefined;
	/** Framework-specific bootstrapping */
	bootstrap?:
		| {
				framework: "vite" | "bun-fullstack";
				path?: string | undefined;
				importPath?: string | undefined;
				bunFeatures?: ("serve" | "build")[] | undefined;
		  }
		| undefined;
	/** Metadata for reporting */
	metadata: {
		displayPath: string;
		framework: string;
		validator: string;
		packageManager: string;
		importPath: string;
	};
};

/**
 * The collected state of the user's workspace prior to scaffolding.
 */
export type CollectedState = {
	cwd: string;
	options: ProjectOptions;
	detectedFramework: "vite" | "bun-fullstack" | "vanilla";
	detectedBunFeatures?: ("serve" | "build")[] | undefined;
	packageManager: "pnpm" | "yarn" | "npm" | "bun";
	tsConfig: {
		status: "strict" | "not_strict" | "not_found";
		file?: string | undefined;
	};
	shouldUpdateTsConfig: boolean;
	existingFiles: string[];
	isYes: boolean;
};
