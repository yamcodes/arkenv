import type { LoggerPort as Reporter } from "@/shared/ports/logger.port";
import type { ParsedTsConfig } from "@/shared/ports/project-scanner.port";
import type { WorkspacePort as Workspace } from "@/shared/ports/workspace.port";

export type { Reporter, Workspace };

export type Validator = "arktype" | "zod" | "valibot";
export type Framework = "vite" | "bun-fullstack" | "vanilla" | "nextjs";
export type PackageManager = "pnpm" | "yarn" | "npm" | "bun";

/**
 * Options chosen by the user or inferred for scaffolding the project.
 */
export type ProjectOptions = {
	mode?: "existing" | "new";
	example?: string;
	name?: string;
	path: string;
	validator: Validator;
	framework: Framework;
	layout?: "strict" | "simple";
	bunFeatures?: ("serve" | "build")[];
	language: "ts"; // TODO: Support JS
	overwriteEnvSchemaFile?: boolean;
	envDtsHandling?: "overwrite" | "append" | "skip";
	installTypeDefinitions?: boolean;
	envKeys?: string[];
	installSkill?: boolean;
	skillDetected?: boolean;
	disableCodegen?: boolean;
	wrapNextjsConfig?: boolean;
};

/**
 * Represents the complete plan of actions to scaffold ArkEnv.
 */
export type ScaffoldingPlan = {
	/** The target project root directory */
	cwd: string;
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
		packageManager: PackageManager;
		dependencies: string[];
		cwd?: string;
	};
	/** Optional skill installation */
	skill?: {
		dlxCommand: string[];
		packageName: string;
		isYes: boolean;
	};
	/** Framework-specific bootstrapping */
	bootstrap?: {
		framework: Exclude<Framework, "vanilla">;
		path?: string;
		importPath?: string;
		bunFeatures?: ("serve" | "build")[];
		wrapNextjsConfig?: boolean;
	};
	/** Metadata for reporting */
	metadata: {
		displayPath: string;
		framework: Framework;
		validator: Validator;
		packageManager: PackageManager;
		importPath: string;
		mode: "existing" | "new";
		example?: string;
		name?: string;
		layout?: "strict" | "simple";
		skillDetected?: boolean;
		disableCodegen?: boolean;
	};
	/** Git clone information for new project flow */
	clone?: {
		repository: string;
		example: string;
		targetName: string;
		/** Absolute path to copy the example into. Defaults to process.cwd() when absent. */
		targetDir?: string;
	};
};

/**
 * The collected state of the user's workspace prior to scaffolding.
 */
export type CollectedState = {
	mode: "existing" | "new";
	cwd: string;
	options: ProjectOptions;
	detectedFramework: Framework;
	detectedBunFeatures?: ("serve" | "build")[];
	packageManager: PackageManager;
	tsConfig: {
		status: "strict" | "not_strict" | "not_found";
		file?: string;
		parsed?: ParsedTsConfig;
	};
	shouldUpdateTsConfig: boolean;
	existingFiles: string[];
	isYes: boolean;
};
