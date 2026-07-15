import path from "node:path";
import { shake } from "radashi";
import { code } from "@/cli/ui";
import {
	type CollectedState,
	createPlan,
	Executor,
	type Framework,
	type HostPreset,
} from "@/features/scaffold";
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
	isStrict?: boolean;
	isSimple?: boolean;
	isFlat?: boolean;
	example?: string;
	name?: string;
	noCodegen?: boolean;
	hostPreset?: HostPreset;
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
			let name = input.name;
			if (name) {
				const resolved = path.resolve(process.cwd(), name);
				if (resolved === process.cwd()) {
					name = ".";
				}
			}
			const normalizedInput: InitInput = {
				...input,
				...(name !== undefined && { name }),
			};

			const targetDir =
				name && name !== "."
					? path.resolve(process.cwd(), name)
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
			if (normalizedInput.example !== undefined) {
				return await this.collectNewProject(normalizedInput, isEmpty);
			}

			if (hasPackageJson) {
				return await this.collectExistingProject(normalizedInput, targetDir);
			}

			if (isEmpty || normalizedInput.isForce) {
				return await this.collectNewProject(normalizedInput, isEmpty);
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
		const { isYes, isForce, isQuiet, isAgent } = input;

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

		const gitStatus = await this.scanner.checkGitStatus(targetDir);
		if (gitStatus.status === "dirty") {
			if (isForce) {
				this.logger.warn(
					"Git working tree is not clean, but continuing due to --force flag.",
				);
			} else {
				this.logger.error(
					"Git working tree is not clean. Commit or stash your changes (use 'git stash -u' for untracked files) before running arkenv init.",
				);
				this.logger.info("Use --force to bypass this check.");
				return null;
			}
		}

		if (gitStatus.status === "unknown") {
			this.logger.warn(
				"Git working tree status could not be determined. Proceeding with caution.",
			);
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
		if (input.isSimple && detectedFramework === "nextjs") {
			this.logger.error(
				"❌ Error: The --simple layout is deprecated and no longer supported by the CLI. Arkenv now exclusively uses the Flat Layout. Run npx arkenv init without this flag.",
			);
			return null;
		}
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

		const hasEnvSchemaFile = await (async () => {
			// For strict layout, we need to check the variant paths, not the base path.
			// When isStrict is requested via flag, peek at those paths before the wizard runs.
			if (input.isStrict) {
				const ext = path.extname(targetPath);
				const baseWithoutExt = targetPath.slice(0, -ext.length);
				const strictPaths = [
					path.join(baseWithoutExt, "internal", `shared${ext}`),
					path.join(baseWithoutExt, `client${ext}`),
					path.join(baseWithoutExt, `server${ext}`),
				];
				const checks = await Promise.all(
					strictPaths.map((p) => this.workspace.exists(p)),
				);
				if (checks.some(Boolean)) return true;
			}
			return this.workspace.exists(targetPath);
		})();

		const hasTypeFileAtPath = async ({
			framework,
			envPath,
		}: {
			framework: Framework;
			envPath: string;
		}) => {
			if (framework !== "vite" && framework !== "bun-fullstack") {
				return false;
			}

			const typeFile = framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
			const targetPath = path.resolve(targetDir, envPath);
			const targetDirOfSchema = path.dirname(targetPath);
			const typeFilePath = path.join(targetDirOfSchema, typeFile);
			return this.workspace.exists(typeFilePath);
		};
		const hasTypeFile = await hasTypeFileAtPath({
			framework: detectedFramework,
			envPath: defaultEnvPath,
		});

		const options = await this.prompt.runWizard(
			shake({
				mode: "existing" as const,
				framework: detectedFramework,
				bunFeatures: detectedBunFeatures,
				defaultEnvPath,
				tsConfig: tsConfig.parsed ?? null,
				envKeys: envRes?.keys,
				envKeysSource: envRes?.source,
				hasTypeFileAtPath,
				hasTypeFile,
				hasEnvSchemaFile,
				isStrict: input.isStrict,
				isSimple: input.isSimple,
				isFlat: input.isFlat,
				disableCodegen: input.noCodegen,
				hostPreset: input.hostPreset,
			}),
			isYes,
		);

		if (options === null) {
			return null;
		}

		const hasSkill = await this.scanner.hasSkill(targetDir);
		if (hasSkill) {
			options.skillDetected = true;
			if (!isQuiet && !isAgent) {
				this.logger.info("ArkEnv agent skill detected.");
			}
		}

		// Handle installSkill logic
		if (hasSkill) {
			options.installSkill = false;
		} else if (isAgent) {
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

		if (options.overwriteEnvSchemaFile === undefined) {
			// For strict layout, check whether any of the three variant files already exist
			const existsCheck =
				options.layout === "strict"
					? await (async () => {
							const ext = path.extname(finalTargetPath);
							const baseWithoutExt = finalTargetPath.slice(0, -ext.length);
							const checks = await Promise.all([
								this.workspace.exists(
									path.join(baseWithoutExt, "internal", `shared${ext}`),
								),
								this.workspace.exists(
									path.join(baseWithoutExt, `client${ext}`),
								),
								this.workspace.exists(
									path.join(baseWithoutExt, `server${ext}`),
								),
							]);
							return checks.some(Boolean);
						})()
					: await this.workspace.exists(finalTargetPath);

			if (existsCheck) {
				const label =
					options.layout === "strict"
						? "Strict layout files (client, server, internal/shared)"
						: path.basename(finalTargetPath);
				const confirmOverwrite = await this.prompt.confirm(
					`${label} already exist. Overwrite?`,
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
		}

		const packageManager = await this.scanner.detectPackageManager(
			targetDir,
			tsConfig.parsed,
		);

		const ext = path.extname(finalTargetPath);
		const baseWithoutExt = finalTargetPath.slice(0, -ext.length);

		// Determine which paths we actually care about based on the resolved layout
		const pathsToCheck =
			options.layout === "strict"
				? [
						path.join(baseWithoutExt, "internal", `shared${ext}`),
						path.join(baseWithoutExt, `client${ext}`),
						path.join(baseWithoutExt, `server${ext}`),
					]
				: [finalTargetPath];

		const existingFiles: string[] = [];
		for (const p of pathsToCheck) {
			if (await this.workspace.exists(p)) existingFiles.push(p);
		}

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

		const envPath = path.join(targetDir, ".env");
		const envExamplePath = path.join(targetDir, ".env.example");

		if (await this.workspace.exists(envPath)) {
			existingFiles.push(envPath);
			options.envContent = await this.workspace.readFile(envPath);
		}
		if (await this.workspace.exists(envExamplePath)) {
			existingFiles.push(envExamplePath);
			options.envExampleContent = await this.workspace.readFile(envExamplePath);
		}

		const gitignorePath = path.join(targetDir, ".gitignore");
		if (await this.workspace.exists(gitignorePath)) {
			existingFiles.push(gitignorePath);
			options.gitignoreContent = await this.workspace.readFile(gitignorePath);
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
		const { isYes, example, name, isForce } = input;

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
		if (options.name === "." && !isEmpty && !isForce) {
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
