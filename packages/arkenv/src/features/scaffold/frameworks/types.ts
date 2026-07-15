import type {
	Framework,
	ProjectOptions,
	ScaffoldingPlan,
} from "@/features/scaffold/plan";
import type { ValidatorStrategy } from "@/features/scaffold/validators/types";
import type { ParsedTsConfig } from "@/shared/ports/project-scanner.port";

export type FrameworkGetFilesParams = {
	targetPath: string;
	targetDir: string;
	cwd: string;
	existingFiles: string[];
	overwriteEnvSchemaFile?: boolean | undefined;
	installTypeDefinitions?: boolean | undefined;
	envDtsHandling?: "overwrite" | "append" | "skip" | undefined;
	path: string;
	tsConfig?: {
		file?: string;
		parsed?: ParsedTsConfig;
	};
};

/**
 * Framework-specific scaffolding operations for planning file layout and dependencies.
 */
export type FrameworkStrategy = {
	/**
	 * Canonical client-exposed env var prefix for this framework
	 * (e.g. `NEXT_PUBLIC_`, `VITE_`, or `""` for vanilla).
	 */
	clientPrefix: string;

	/**
	 * Default environment variable values for this framework.
	 *
	 * @param keys Optional explicit env keys to generate defaults for.
	 * @returns A map of env var names to default values.
	 */
	getEnvDefaults(keys?: string[]): Record<string, string>;

	/**
	 * Additional dependencies required by this framework integration.
	 *
	 * @param options The selected project options.
	 * @returns Package names to install alongside arkenv and the validator.
	 */
	getDependencies(options: ProjectOptions): string[];

	/**
	 * Whether this framework requires arktype as a peer dependency.
	 *
	 * @param options The selected project options.
	 * @returns True when arktype should be added to the install list.
	 */
	requiresArktypePeer(options: ProjectOptions): boolean;

	/**
	 * Build framework-specific bootstrap configuration for the executor.
	 *
	 * @param options The selected project options.
	 * @returns Bootstrap config or undefined when not applicable.
	 */
	bootstrap(options: ProjectOptions): ScaffoldingPlan["bootstrap"] | undefined;

	/**
	 * Plan env schema files using the validator strategy for template content.
	 *
	 * @param validator The validator strategy providing template generation.
	 * @param options The selected project options.
	 * @param params File planning parameters including paths and existing files.
	 * @returns Planned schema file actions.
	 */
	getSchemaFiles(
		validator: ValidatorStrategy,
		options: ProjectOptions,
		params: FrameworkGetFilesParams,
	): ScaffoldingPlan["files"];

	/**
	 * Plan framework-specific type definition files, if any.
	 *
	 * @param options The selected project options.
	 * @param params File planning parameters including paths and existing files.
	 * @returns Planned type definition file actions.
	 */
	getTypeDefinitionFiles(
		options: ProjectOptions,
		params: FrameworkGetFilesParams,
	): ScaffoldingPlan["files"];
};

/**
 * Exhaustive registry of framework strategies keyed by framework name.
 */
export type FrameworkRegistry = Record<Framework, FrameworkStrategy>;
