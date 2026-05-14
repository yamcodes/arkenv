import { existsSync } from "node:fs";
import path from "node:path";
import { confirm, isCancel } from "@clack/prompts";
import pc from "picocolors";
import type { CLI } from "../cli";
import { Executor } from "../executor";
import { CliReporter } from "../lib/reporter";
import { NodeWorkspace } from "../lib/workspace";
import type { CollectedState } from "../plan";
import { createPlan } from "../planner";
import type { ProjectOptions } from "../prompts";
import { runPromptWizard } from "../prompts";
import {
	checkTsConfig,
	detectFramework,
	detectPackageManager,
} from "../scaffold";
import { code } from "../visuals";

export class InitCommand {
	constructor(private cli: CLI) {}

	async run() {
		const state = await this.collect();
		if (!state) return;

		const plan = createPlan(state);

		const workspace = new NodeWorkspace(this.cli.isQuiet, this.cli.logger.stdio);
		const reporter = new CliReporter(this.cli.logger);
		const executor = new Executor(workspace, reporter);

		try {
			await executor.execute(plan);
		} catch (error) {
			this.cli.logger.fatal("Scaffolding failed.", error);
		}
	}

	private async collect(): Promise<CollectedState | null> {
		const { logger, isYes } = this.cli;

		// Redirect stdout to stderr for interactive prompts if JSON mode is active
		logger.interactiveStdout(true);

		try {
			let shouldUpdateTsConfig = false;
			const tsConfig = await checkTsConfig();

			if (tsConfig.status === "not_strict") {
				if (isYes) {
					shouldUpdateTsConfig = true;
				} else {
					logger.warn(
						`TypeScript strict mode is not enabled in your ${code(tsConfig.file!)}.`,
					);

					const confirmStrict = await confirm({
						message: `ArkEnv requires ${pc.dim("strict")} mode in your ${code(tsConfig.file!)}. Would you like to enable it now?`,
						initialValue: true,
						active: "Yes (Recommended)",
						inactive: "No",
					});

					if (isCancel(confirmStrict)) {
						logger.cancel("Operation cancelled.");
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
				this.cli.isAgent,
			);

			if (!options) {
				logger.cancel("Operation cancelled.");
				return null;
			}

			// Handle existing env file prompt
			const targetPath = path.resolve(process.cwd(), options.path);
			if (existsSync(targetPath) && options.overwriteEnvSchemaFile === undefined) {
				const confirmOverwrite = await confirm({
					message: `File ${path.basename(targetPath)} already exists. Overwrite?`,
					initialValue: false,
				});

				if (isCancel(confirmOverwrite)) {
					logger.cancel("Operation cancelled.");
					return null;
				}

				options.overwriteEnvSchemaFile = confirmOverwrite;
			}

			const packageManager = await detectPackageManager();

			const existingFiles: string[] = [];
			if (existsSync(targetPath)) existingFiles.push(targetPath);

			const targetDir = path.dirname(targetPath);
			const typeFileName =
				options.framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
			const typeFilePath = path.join(targetDir, typeFileName);
			if (existsSync(typeFilePath)) existingFiles.push(typeFilePath);

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
			logger.interactiveStdout(false);
		}
	}
}
