import path from "node:path";
import pc from "picocolors";
import { code } from "@/cli/ui";
import {
	type CollectedState,
	checkTsConfig,
	createPlan,
	detectFramework,
	detectPackageManager,
	Executor,
} from "@/features/scaffold";
import type { LoggerPort, PromptPort, WorkspacePort } from "@/shared/ports";

/**
 * Input parameters for the 'init' command.
 */
export type InitInput = {
	isYes: boolean;
	isQuiet: boolean;
	isAgent: boolean;
};

/**
 * Use case for initializing ArkEnv in a new or existing project.
 */
export class InitUseCase {
	constructor(
		private readonly logger: LoggerPort,
		private readonly workspace: WorkspacePort,
		private readonly prompt: PromptPort,
	) {}

	async execute(input: InitInput) {
		const state = await this.collect(input);
		if (!state) return;

		const plan = createPlan(state);
		const executor = new Executor(this.workspace, this.logger);

		try {
			await executor.execute(plan);
		} catch (error) {
			this.logger.fatal("Scaffolding failed.", error);
		}
	}

	private async collect(input: InitInput): Promise<CollectedState | null> {
		const { isYes, isAgent } = input;

		// Redirect stdout to stderr for interactive prompts if JSON mode is active
		this.logger.interactiveStdout(true);

		try {
			let shouldUpdateTsConfig = false;
			const tsConfig = await checkTsConfig();

			if (tsConfig.status === "not_strict") {
				if (isYes) {
					shouldUpdateTsConfig = true;
				} else {
					this.logger.warn(
						`TypeScript strict mode is not enabled in your ${code(tsConfig.file!)}.`,
					);

					const confirmStrict = await this.prompt.confirm(
						`ArkEnv requires ${pc.dim("strict")} mode in your ${code(tsConfig.file!)}. Would you like to enable it now?`,
						true,
					);

					if (!confirmStrict) {
						this.logger.cancel("Operation cancelled.");
						return null;
					}

					shouldUpdateTsConfig = true;
				}
			}

			const detectedFramework = await detectFramework();
			const options = await this.prompt.runWizard(
				{ framework: detectedFramework },
				isYes,
			);

			if (!options) {
				this.logger.cancel("Operation cancelled.");
				return null;
			}

			// Handle installSkill logic based on product context
			if (isAgent) {
				options.installSkill = false;
			} else if (isYes) {
				options.installSkill = true;
			} else {
				const confirmInstall = await this.prompt.confirm(
					"Would you like to install the ArkEnv agent skill?",
					true,
				);
				if (confirmInstall === null) {
					this.logger.cancel("Operation cancelled.");
					return null;
				}
				options.installSkill = confirmInstall;
			}

			// Handle existing env file prompt
			const targetPath = path.resolve(process.cwd(), options.path);

			if (
				(await this.workspace.exists(targetPath)) &&
				options.overwriteEnvSchemaFile === undefined
			) {
				const confirmOverwrite = await this.prompt.confirm(
					`File ${path.basename(targetPath)} already exists. Overwrite?`,
					false,
				);

				if (!confirmOverwrite) {
					this.logger.cancel("Operation cancelled.");
					return null;
				}

				options.overwriteEnvSchemaFile = confirmOverwrite;
			}

			const packageManager = await detectPackageManager();

			const existingFiles: string[] = [];
			if (await this.workspace.exists(targetPath))
				existingFiles.push(targetPath);

			let typeFileName: string | undefined;
			if (options.framework === "vite") {
				typeFileName = "vite-env.d.ts";
			} else if (options.framework === "bun") {
				typeFileName = "bun-env.d.ts";
			}

			if (typeFileName) {
				const targetDir = path.dirname(targetPath);
				const typeFilePath = path.join(targetDir, typeFileName);
				if (await this.workspace.exists(typeFilePath))
					existingFiles.push(typeFilePath);
			}

			return {
				cwd: process.cwd(),
				options,
				detectedFramework,
				packageManager,
				tsConfig,
				shouldUpdateTsConfig,
				existingFiles,
				isYes,
			};
		} finally {
			// Restore stdout
			this.logger.interactiveStdout(false);
		}
	}
}
