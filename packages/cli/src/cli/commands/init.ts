import path from "node:path";
import { shake } from "radashi";
import { code } from "@/cli/ui";
import { type CollectedState, createPlan, Executor } from "@/features/scaffold";
import { RegistryClient } from "@/shared/clients";
import type {
	LoggerPort,
	ProjectScannerPort,
	PromptPort,
	WorkspacePort,
} from "@/shared/ports";

/**
 * Input parameters for the 'init' command.
 */
export type InitInput = {
	isYes: boolean;
	isForce: boolean;
	isQuiet: boolean;
	isAgent: boolean;
	example?: string;
	name?: string;
};

/**
 * Use case for initializing ArkEnv in a new or existing project.
 */
export class InitUseCase {
	/**
	 * Creates the init use case with adapters for prompting, scanning, and filesystem work.
	 */
	constructor(
		private readonly logger: LoggerPort,
		private readonly workspace: WorkspacePort,
		private readonly prompt: PromptPort,
		private readonly scanner: ProjectScannerPort,
		private readonly registry = new RegistryClient(),
	) {}

	/**
	 * Collects init options, creates a scaffolding plan, and executes it.
	 */
	async execute(input: InitInput): Promise<boolean> {
		const state = await this.collect(input);
		if (!state) return false;

		const plan = createPlan(state);
		const executor = new Executor(this.workspace, this.logger);

		try {
			await executor.execute(plan);
		} catch (error) {
			this.logger.fatal("Scaffolding failed.", error);
		}

		return true;
	}

	/**
	 * Chooses the existing project or new project collection flow for the current directory.
	 */
	private async collect(input: InitInput): Promise<CollectedState | null> {
		this.logger.interactiveStdout(true);

		try {
			const targetDir =
				input.name && input.name !== "."
					? path.resolve(process.cwd(), input.name)
					: process.cwd();

			const dirExists = await this.workspace.exists(targetDir);
			const hasPackageJson = dirExists
				? await this.scanner.hasPackageJson(targetDir)
				: false;
			const isEmpty = dirExists
				? await this.scanner.isEmptyDirectory(targetDir)
				: true;

			// --example always forces the new-project flow, even in non-empty or
			// existing-project directories.
			if (input.example !== undefined) {
				return await this.collectNewProject(input, isEmpty);
			}

			if (hasPackageJson) {
				return await this.collectExistingProject(input, targetDir);
			}

			if (isEmpty || input.isForce) {
				return await this.collectNewProject(input, isEmpty);
			}

			this.logger.error(
				`Directory is not empty and no ${code("package.json")} was found.`,
			);
			this.logger.info(
				`To scaffold a new project, run ${code("arkenv init")} in an empty directory or use ${code("--force")} to proceed anyway.`,
			);
			return null;
		} finally {
			this.logger.interactiveStdout(false);
		}
	}

	/**
	 * Collects configuration for installing ArkEnv into a project with `package.json`.
	 */
	private async collectExistingProject(
		input: InitInput,
		targetDir: string,
	): Promise<CollectedState | null> {
		const { isYes, isForce, isAgent } = input;

		const requirements = await this.scanner.checkRequirements(targetDir);
		const failures = requirements.filter((r) => r.status === "fail");
		const warnings = requirements.filter((r) => r.status === "warn");

		for (const warn of warnings) {
			this.logger.warn(`${warn.requirement}: ${warn.message}`);
		}

		if (failures.length > 0) {
			if (isForce) {
				this.logger.warn(
					"Technical requirements not met, but continuing due to --force flag.",
				);
				for (const fail of failures) {
					this.logger.warn(`${fail.requirement}: ${fail.message}`);
				}
			} else {
				this.logger.error("Technical requirements not met:");
				for (const fail of failures) {
					this.logger.error(
						`- ${fail.requirement}: ${fail.message}${fail.current ? ` (Current: ${fail.current}, Expected: ${fail.expected})` : ""}`,
					);
				}
				this.logger.info("Use --force to bypass these checks.");
				return null;
			}
		}

		let shouldUpdateTsConfig = false;
		const tsConfig = await this.scanner.checkTsConfig(targetDir);

		if (tsConfig.status === "not_strict") {
			if (isYes) {
				shouldUpdateTsConfig = true;
			} else {
				this.logger.warn(
					`TypeScript strict mode is not enabled in your ${code(tsConfig.file!)}.`,
				);

				const confirmStrict = await this.prompt.confirm(
					`ArkEnv requires ${code("strict")} mode in your ${code(tsConfig.file!)}. Would you like to enable it now?`,
					true,
					"Yes (Recommended)",
				);

				if (confirmStrict === null) {
					return null;
				}

				if (!confirmStrict) {
					this.logger.cancel("Operation cancelled.");
					return null;
				}

				shouldUpdateTsConfig = true;
			}
		}

		const detectedFramework = await this.scanner.detectFramework(
			targetDir,
			tsConfig.parsed,
		);
		const detectedBunFeatures =
			detectedFramework === "bun-fullstack"
				? await this.scanner.detectBunFeatures(targetDir, tsConfig.parsed)
				: undefined;
		const defaultEnvPath = await this.scanner.suggestDefaultEnvPath(
			targetDir,
			tsConfig.parsed,
		);

		const targetPath = path.resolve(targetDir, defaultEnvPath);
		const envRes = await this.scanner.getEnvExampleKeys(
			targetDir,
			tsConfig.parsed,
			targetPath,
		);

		let hasTypeFile = false;
		if (detectedFramework === "vite" || detectedFramework === "bun-fullstack") {
			const typeFile =
				detectedFramework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
			const targetDirOfSchema = path.dirname(targetPath);
			const typeFilePath = path.join(targetDirOfSchema, typeFile);
			hasTypeFile = await this.workspace.exists(typeFilePath);
		}

		const options = await this.prompt.runWizard(
			shake({
				mode: "existing" as const,
				framework: detectedFramework,
				bunFeatures: detectedBunFeatures,
				defaultEnvPath,
				tsConfig: tsConfig.parsed ?? null,
				envKeys: envRes?.keys,
				envKeysSource: envRes?.source,
				hasTypeFile,
			}),
			isYes,
		);

		if (options === null) {
			return null;
		}

		// Handle installSkill logic
		if (isAgent) {
			options.installSkill = false;
		} else if (isYes) {
			options.installSkill = true;
		} else {
			const confirmInstall = await this.prompt.confirm(
				"Would you like to install the ArkEnv agent skill?",
				true,
				"Yes (Recommended)",
			);
			if (confirmInstall === null) {
				return null;
			}
			options.installSkill = confirmInstall;
		}

		// Handle existing env file prompt
		const finalTargetPath = path.resolve(targetDir, options.path);

		if (
			(await this.workspace.exists(finalTargetPath)) &&
			options.overwriteEnvSchemaFile === undefined
		) {
			const confirmOverwrite = await this.prompt.confirm(
				`File ${code(path.basename(finalTargetPath))} already exists. Overwrite?`,
				false,
			);

			if (confirmOverwrite === null) {
				return null;
			}

			if (!confirmOverwrite) {
				this.logger.cancel("Operation cancelled.");
				return null;
			}

			options.overwriteEnvSchemaFile = confirmOverwrite;
		}

		const packageManager = await this.scanner.detectPackageManager(
			targetDir,
			tsConfig.parsed,
		);

		const existingFiles: string[] = [];
		if (await this.workspace.exists(finalTargetPath))
			existingFiles.push(finalTargetPath);

		let typeFileName: string | undefined;
		if (options.framework === "vite") {
			typeFileName = "vite-env.d.ts";
		} else if (options.framework === "bun-fullstack") {
			typeFileName = "bun-env.d.ts";
		}

		if (typeFileName) {
			const targetDirOfSchema = path.dirname(finalTargetPath);
			const typeFilePath = path.join(targetDirOfSchema, typeFileName);
			if (await this.workspace.exists(typeFilePath))
				existingFiles.push(typeFilePath);
		}

		return shake({
			mode: "existing" as const,
			cwd: targetDir,
			options,
			detectedFramework,
			detectedBunFeatures,
			packageManager,
			tsConfig,
			shouldUpdateTsConfig,
			existingFiles,
			isYes,
		});
	}

	/**
	 * Collects configuration for scaffolding a project from an example example.
	 */
	private async collectNewProject(
		input: InitInput,
		isEmpty = true,
	): Promise<CollectedState | null> {
		const { isYes, example, name } = input;

		const registry = await this.registry.fetchRegistry();

		const options = await this.prompt.runWizard(
			shake({
				mode: "new" as const,
				examples: registry.examples,
				example,
				name,
			}),
			isYes,
		);

		if (options === null) {
			return null;
		}

		// When the resolved project name is "." (current dir) and the directory is
		// not empty, abort to avoid clobbering the existing contents.
		if (options.name === "." && !isEmpty) {
			this.logger.error(
				`Cannot scaffold into ${code(".")} because the current directory is not empty.`,
			);
			this.logger.info(
				`Run ${code("arkenv init")} in an empty directory or choose a sub-directory name instead.`,
			);
			return null;
		}

		const packageManager = this.detectPackageManager();

		return shake({
			mode: "new" as const,
			cwd: process.cwd(),
			options,
			detectedFramework: options.framework,
			packageManager,
			tsConfig: { status: "not_found" },
			shouldUpdateTsConfig: false,
			existingFiles: [],
			isYes,
		});
	}

	/**
	 * Infers the active package manager from the current npm user agent.
	 */
	private detectPackageManager(): "pnpm" | "yarn" | "npm" | "bun" {
		const userAgent = process.env.npm_config_user_agent || "";
		if (userAgent.includes("pnpm")) return "pnpm";
		if (userAgent.includes("yarn")) return "yarn";
		if (userAgent.includes("bun")) return "bun";
		return "npm";
	}
}
