import type { LoggerPort as Reporter } from "@/shared/ports/logger.port";
import type { WorkspacePort as Workspace } from "@/shared/ports/workspace.port";

export type { Reporter, Workspace };

/**
 * Options chosen by the user or inferred for scaffolding the project.
 */
export type ProjectOptions = {
	mode?: "existing" | "new";
	template?: string | undefined;
	name?: string | undefined;
	path: string;
	validator: "arktype" | "zod" | "valibot";
	framework: "vite" | "bun-fullstack" | "vanilla";
	bunFeatures?: ("serve" | "build")[];
	language: "ts"; // TODO: Support JS
	overwriteEnvSchemaFile?: boolean;
	envDtsHandling?: "overwrite" | "append" | "skip";
	installTypeDefinitions?: boolean;
	envKeys?: string[];
	installSkill?: boolean;
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
		dlxCommand: string[];
		packageName: string;
		isYes: boolean;
	};
	/** Framework-specific bootstrapping */
	bootstrap?: {
		framework: "vite" | "bun-fullstack";
		path?: string;
		importPath?: string;
		bunFeatures?: ("serve" | "build")[];
	};
	/** Metadata for reporting */
	metadata: {
		displayPath: string;
		framework: string;
		validator: string;
		packageManager: string;
		importPath: string;
		mode: "existing" | "new";
		template?: string | undefined;
		name?: string | undefined;
	};
	/** Git clone information for new project flow */
	clone?: {
		repository: string;
		template: string;
		targetName: string;
	};
};

/**
 * The collected state of the user's workspace prior to scaffolding.
 */
export type CollectedState = {
	mode: "existing" | "new";
	cwd: string;
	options: ProjectOptions;
	detectedFramework: "vite" | "bun-fullstack" | "vanilla";
	detectedBunFeatures?: ("serve" | "build")[];
	packageManager: "pnpm" | "yarn" | "npm" | "bun";
	tsConfig: {
		status: "strict" | "not_strict" | "not_found";
		file?: string;
	};
	shouldUpdateTsConfig: boolean;
	existingFiles: string[];
	isYes: boolean;
};
