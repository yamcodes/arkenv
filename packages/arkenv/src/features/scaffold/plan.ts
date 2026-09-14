import type { LoggerPort as Reporter } from "@/shared/ports/logger.port";
import type { ParsedTsConfig } from "@/shared/ports/project-scanner.port";
import type { WorkspacePort as Workspace } from "@/shared/ports/workspace.port";
import { parseSemver } from "@/shared/semver";
import { version as pkgVersion } from "../../../package.json";
import type { HostPreset } from "./presets";

export type { Reporter, Workspace };

export type Validator = "arktype" | "zod" | "valibot";
export type Framework =
	| "vite"
	| "bun-fullstack"
	| "vanilla"
	| "nextjs"
	| "nuxt"
	| "rsbuild";
export type PackageManager = "pnpm" | "yarn" | "npm" | "bun";

/** Short `skills add` source once v1 is the default branch (GA). */
export const SKILL_SOURCE_REPO = "yamcodes/arkenv";

/**
 * Pre-release `skills add` source. Skills supports `/tree/<branch>`; the repo
 * default branch is still v0 until GA, so alpha/rc installs must pin `v1`.
 */
export const SKILL_SOURCE_V1_TREE =
	"https://github.com/yamcodes/arkenv/tree/v1";

/**
 * Resolves the `skills add` source for the running CLI version.
 * Pre-release builds pin the v1 tree URL; stable builds use the short repo form.
 *
 * @param version - SemVer string (defaults to this package's version).
 * @returns Source argument for `skills add`.
 */
export function getDefaultSkillSource(version = pkgVersion): string {
	const parsed = parseSemver(version);
	const isPrerelease = (parsed?.prerelease.length ?? 0) > 0;
	return isPrerelease ? SKILL_SOURCE_V1_TREE : SKILL_SOURCE_REPO;
}

/**
 * Source for `skills add` for this build (tree URL while this package is a prerelease).
 */
export const DEFAULT_SKILL_SOURCE = getDefaultSkillSource();

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
	bunFeatures?: ("serve" | "build")[];
	language: "ts"; // TODO: Support JS
	overwriteEnvSchemaFile?: boolean;
	envKeys?: string[];
	installSkill?: boolean;
	skillDetected?: boolean;
	disableCodegen?: boolean;
	wrapNextjsConfig?: boolean;
	envExampleContent?: string;
	gitignoreContent?: string;
	/**
	 * Hosting provider preset selected during init (`none` / Vercel / Netlify / Cloudflare / etc.).
	 */
	hostPreset?: HostPreset;
};

/**
 * Represents the complete plan of actions to scaffold ArkEnv.
 */
export type ScaffoldingPlan = {
	/**
	 * The target project root directory
	 */
	cwd: string;
	/**
	 * Files to be created or modified
	 */
	files: {
		path: string;
		content: string;
		action: "create" | "overwrite";
		label?: string;
	}[];
	/**
	 * TypeScript configuration updates
	 */
	tsConfig?: {
		path: string;
		action: "strict";
	};
	/**
	 * Dependencies to install
	 */
	install?: {
		packageManager: PackageManager;
		dependencies: string[];
		cwd?: string;
	};
	/**
	 * Optional skill installation
	 */
	skill?: {
		dlxCommand: string[];
		packageName: string;
		isYes: boolean;
	};
	/**
	 * Framework-specific bootstrapping
	 */
	bootstrap?: {
		framework: Exclude<Framework, "vanilla">;
		path?: string;
		importPath?: string;
		bunFeatures?: ("serve" | "build")[];
		wrapNextjsConfig?: boolean;
		disableCodegen?: boolean;
	};
	/**
	 * Metadata for reporting
	 */
	metadata: {
		displayPath: string;
		framework: Framework;
		validator: Validator;
		packageManager: PackageManager;
		importPath: string;
		mode: "existing" | "new";
		example?: string;
		name?: string;
		skillDetected?: boolean;
		disableCodegen?: boolean;
	};
	/**
	 * Git clone information for new project flow
	 */
	clone?: {
		repository: string;
		example: string;
		targetName: string;
		/**
		 * Absolute path to copy the example into. Defaults to process.cwd() when absent.
		 */
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
