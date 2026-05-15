import path from "node:path";
import { confirm, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { Executor } from "../../features/scaffold/executor";
import type { CollectedState } from "../../features/scaffold/plan";
import { createPlan } from "../../features/scaffold/planner";
import {
	checkTsConfig,
	detectFramework,
	detectPackageManager,
} from "../../features/scaffold/scaffold";
import type { LoggerPort } from "../../shared/ports/logger.port";
import type { WorkspacePort } from "../../shared/ports/workspace.port";
import { runPromptWizard } from "../ui/prompts";
import { code } from "../ui/visuals";

export type InitInput = {
	isYes: boolean;
	isQuiet: boolean;
	isAgent: boolean;
};

export class InitUseCase {
	constructor(
		private readonly logger: LoggerPort,
		private readonly workspace: WorkspacePort,
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

					const confirmStrict = await confirm({
						message: `ArkEnv requires ${pc.dim("strict")} mode in your ${code(tsConfig.file!)}. Would you like to enable it now?`,
						initialValue: true,
						active: "Yes (Recommended)",
						inactive: "No",
					});

					if (isCancel(confirmStrict)) {
						this.logger.cancel("Operation cancelled.");
						return null;
					}

					if (confirmStrict) {
						shouldUpdateTsConfig = true;
					}
				}
			}

			const detectedFramework = await detectFramework();
			const options = await runPromptWizard(
				{ framework: detectedFramework },
				isYes,
				isAgent,
			);

			if (!options) {
				this.logger.cancel("Operation cancelled.");
				return null;
			}

			// Handle existing env file prompt
			// Note: In a strict hexagonal architecture, we'd move this FS check to a port
			const targetPath = path.resolve(process.cwd(), options.path);

			// For now, keeping some FS calls here for simplicity as it was in the original code,
			// but normally we should use this.workspace.exists(targetPath)

			if (
				(await this.workspace.exists(targetPath)) &&
				options.overwriteEnvSchemaFile === undefined
			) {
				const confirmOverwrite = await confirm({
					message: `File ${path.basename(targetPath)} already exists. Overwrite?`,
					initialValue: false,
				});

				if (isCancel(confirmOverwrite)) {
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
