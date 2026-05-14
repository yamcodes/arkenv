import { spawn } from "node:child_process";
import path from "node:path";
import { confirm, isCancel } from "@clack/prompts";
import dedent from "dedent";
import pc from "picocolors";
import type { CLI } from "../cli";
import {
	bootstrapBunConfig,
	bootstrapViteConfig,
	findBunConfig,
	findViteConfig,
} from "../lib/config-mutation";
import type { ProjectOptions } from "../prompts";
import { runPromptWizard } from "../prompts";
import {
	checkTsConfig,
	detectFramework,
	getDlxCommand,
	scaffold,
} from "../scaffold";
import { code, symbol } from "../visuals";

export class InitCommand {
	constructor(private cli: CLI) {}

	async run() {
		const { logger, isYes } = this.cli;

		// Redirect stdout to stderr for interactive prompts if JSON mode is active
		logger.interactiveStdout(true);

		let shouldUpdateTsConfig = false;
		let options: ProjectOptions | null = null;

		try {
			const tsConfigResult = await checkTsConfig();

			if (tsConfigResult.status === "not_strict") {
				if (isYes) {
					shouldUpdateTsConfig = true;
				} else {
					logger.warn(
						`TypeScript strict mode is not enabled in your ${code(tsConfigResult.file!)}.`,
					);

					const confirmStrict = await confirm({
						message: `ArkEnv requires ${pc.dim("strict")} mode in your ${code(tsConfigResult.file!)}. Would you like to enable it now?`,
						initialValue: true,
						active: "Yes (Recommended)",
						inactive: "No",
					});

					if (isCancel(confirmStrict)) {
						logger.cancel("Operation cancelled.");
					}

					if (confirmStrict) {
						shouldUpdateTsConfig = true;
					}
				}
			}

			const detectedFramework = await detectFramework();
			options = await runPromptWizard(
				{ framework: detectedFramework },
				isYes,
				this.cli.isAgent,
			);
		} finally {
			// Restore stdout
			logger.interactiveStdout(false);
		}

		if (!options) {
			logger.cancel("Operation cancelled.");
			return;
		}

		const s = logger.spinner();
		s.start("Scaffolding ArkEnv configuration...");

		try {
			const {
				tsConfigResult: tsResult,
				installCmd,
				packageManager,
				typeDefinitionResult: typeResult,
			} = await scaffold({
				...options,
				shouldUpdateTsConfig,
			});
			s.stop("Configuration scaffolded!");

			if (installCmd && process.env.SKIP_INSTALL !== "true") {
				logger.step(`Installing dependencies with ${packageManager}...`);
				await this.execute(installCmd);
			}

			if (tsResult.status === "updated") {
				logger.info(`Enforced strict: true in your ${code(tsResult.file!)}`);
			} else if (tsResult.status === "error") {
				logger.warn(
					`Could not automatically update ${code(tsResult.file || "tsconfig.json")}. Please ensure 'strict: true' is set manually.`,
				);
			}

			if (typeResult.status === "created") {
				logger.info(
					`Created ${code(typeResult.file!)} for typesafe environment variables.`,
				);
			} else if (typeResult.status === "overwritten") {
				logger.info(
					`Updated ${code(typeResult.file!)} for typesafe environment variables.`,
				);
			} else if (typeResult.status === "appended") {
				logger.info(`Appended ArkEnv types to ${code(typeResult.file!)}.`);
			}

			const relPath = path.relative(process.cwd(), path.resolve(options.path));
			const displayPath = relPath.startsWith(".") ? relPath : `./${relPath}`;
			const importPath = displayPath.replace(/\.(ts|js|tsx|jsx)$/, "");

			// Framework-specific bootstrapping
			if (options.framework === "vite") {
				const viteConfigPath = await findViteConfig();
				if (viteConfigPath) {
					logger.step("Bootstrapping Vite plugin...");
					const result = await bootstrapViteConfig(viteConfigPath, importPath);
					if (result.success) {
						logger.info(`Updated ${code(path.basename(viteConfigPath))}`);
					} else {
						logger.warn(
							`Could not automatically update ${code(path.basename(viteConfigPath))}: ${result.error}`,
						);
						logger.info("Please add '@arkenv/vite-plugin' manually.");
					}
				} else {
					logger.info(
						"No Vite config found — please add '@arkenv/vite-plugin' to your Vite config manually.",
					);
				}
			} else if (options.framework === "bun") {
				const bunConfigPath = await findBunConfig();
				const result = await bootstrapBunConfig(bunConfigPath);
				if (result.success && result.instructions) {
					logger.info(result.instructions);
				} else if (!result.success) {
					logger.error(result.error || "Bun bootstrap failed");
				}
			}

			const dlx = getDlxCommand(packageManager);
			const yesFlag = this.cli.isYes ? " --yes" : "";
			let skillInstalled = false;
			if (options.installSkill && process.env.SKIP_INSTALL !== "true") {
				logger.step("Installing ArkEnv agent skill...");
				try {
					await this.execute(`${dlx} skills add yamcodes/arkenv${yesFlag}`);
					skillInstalled = true;
				} catch (err: any) {
					// Don't fail the whole process if skill install fails, but log it
					// If quiet, the error message already contains the buffered logs
					logger.warn(`Failed to install ArkEnv AI skill: ${err.message}`);
				}
			}

			let usageInstructions = `2. Import and use: ${code(`import { env } from "${importPath}"`)}`;
			if (options.framework === "vite") {
				usageInstructions = `2. Access via ${code("import.meta.env.YOUR_VAR")}`;
			} else if (options.framework === "bun") {
				usageInstructions = `2. Access via ${code("process.env.YOUR_VAR")}`;
			}

			if (skillInstalled) {
				logger.note(
					dedent`
						Inside your AI assistant (e.g. Claude Code), use:
						${pc.cyan("/arkenv")} - automatically refine your schema and configure integrations.
					`,
					"Next steps",
				);
			} else {
				logger.note(
					dedent`
						1. Check ${code(displayPath)} and refine your environment schema.
						${usageInstructions}
						3. (Recommended) Install the AI skill: ${code(`${dlx} skills add yamcodes/arkenv`)}
						   Then run ${pc.cyan("/arkenv")} inside your AI assistant to finish.
					`,
					"Next steps",
				);
			}

			logger.finish(
				`${symbol} ArkEnv scaffolding complete. ${pc.dim("Happy coding!")}`,
				{
					path: displayPath,
					framework: options.framework,
					validator: options.validator,
					packageManager,
					tsConfigUpdated: tsResult.status === "updated",
					skillInstalled,
				},
			);
		} catch (error) {
			s.stop("Scaffolding failed.");
			logger.fatal("Scaffolding failed.", error);
		}
	}

	private async execute(command: string) {
		const { logger, isQuiet } = this.cli;
		const stdio = isQuiet ? "pipe" : (logger.stdio as any);

		return new Promise<void>((resolve, reject) => {
			const child = spawn(command, [], {
				stdio,
				shell: true,
			});

			let stdout = "";
			let stderr = "";
			const MAX_BUFFER = 10_000;

			if (isQuiet) {
				child.stdout?.on("data", (data) => {
					stdout = (stdout + data.toString()).slice(-MAX_BUFFER);
				});
				child.stderr?.on("data", (data) => {
					stderr = (stderr + data.toString()).slice(-MAX_BUFFER);
				});
			}

			child.on("close", (code, signal) => {
				if (code === 0) {
					resolve();
				} else {
					let message =
						code === null
							? `Command terminated by signal ${signal}`
							: `Command failed with code ${code}`;
					if (isQuiet) {
						if (stdout) message += `\n${pc.dim("STDOUT:")}\n${stdout}`;
						if (stderr) message += `\n${pc.red("STDERR:")}\n${stderr}`;
					}
					reject(new Error(message));
				}
			});

			child.on("error", reject);
		});
	}
}
