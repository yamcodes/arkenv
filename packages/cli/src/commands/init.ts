import { spawn } from "node:child_process";
import path from "node:path";
import { confirm, isCancel } from "@clack/prompts";
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
			} = await scaffold({
				...options,
				shouldUpdateTsConfig,
			});
			s.stop("Configuration scaffolded!");

			if (installCmd && process.env.SKIP_INSTALL !== "true") {
				logger.step(`Installing dependencies with ${packageManager}...`);
				await new Promise<void>((resolve, reject) => {
					const child = spawn(installCmd, [], {
						stdio: logger.stdio as any,
						shell: true,
					});
					child.on("close", (code: number | null) => {
						if (code === 0) resolve();
						else
							reject(
								new Error(
									`Installation of ${installCmd} failed with code ${code}`,
								),
							);
					});
					child.on("error", reject);
				});

				// Framework-specific bootstrapping
				if (options.framework === "vite") {
					const viteConfigPath = await findViteConfig();
					if (viteConfigPath) {
						logger.step("Bootstrapping Vite plugin...");
						const result = await bootstrapViteConfig(viteConfigPath);
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
			}

			if (tsResult.status === "updated") {
				logger.info(`Enforced strict: true in your ${code(tsResult.file!)}`);
			} else if (tsResult.status === "error") {
				logger.warn(
					`Could not automatically update ${code(tsResult.file || "tsconfig.json")}. Please ensure 'strict: true' is set manually.`,
				);
			}

			const relPath = path.relative(process.cwd(), path.resolve(options.path));
			const displayPath = relPath.startsWith(".") ? relPath : `./${relPath}`;
			const importPath = displayPath.replace(/\.(ts|js|tsx|jsx)$/, "");

			const dlx = getDlxCommand(packageManager);
			let skillInstalled = false;
			if (options.installSkill && process.env.SKIP_INSTALL !== "true") {
				logger.step("Installing ArkEnv agent skill...");
				await new Promise<void>((resolve) => {
					const child = spawn(`${dlx} skills add yamcodes/arkenv`, [], {
						stdio: logger.stdio as any,
						shell: true,
					});
					child.on("close", (code: number | null) => {
						if (code === 0) {
							skillInstalled = true;
							resolve();
						} else {
							// Don't fail the whole process if skill install fails, but log it
							logger.warn("Failed to install ArkEnv AI skill.");
							resolve();
						}
					});
					child.on("error", (err: Error) => {
						logger.warn(`Failed to install ArkEnv AI skill: ${err.message}`);
						resolve();
					});
				});
			}

			if (skillInstalled) {
				logger.step("complete the setup with your AI assistant. Use:");
				logger.step(
					`${pc.cyan("/arkenv")} - automatically refine your schema and configure framework integrations.`,
				);
			} else {
				logger.step(
					`1. Check ${code(displayPath)} and adapt it to your needs. Review your schema to refine types (e.g., ${code("number")}, ${code("boolean")}, etc.).`,
				);
				logger.step(
					`2. Import and use your environment variables: ${code(`import { env } from "${importPath}"`)} → ${code("env.VAR_NAME")}`,
				);
				logger.step(
					`3. (Recommended) Install the ArkEnv Agent Skill for AI assistance: ${code(`${dlx} skills add yamcodes/arkenv`)}`,
				);
			}

			logger.finish(`${symbol} ${pc.dim("Happy coding!")}`, {
				path: displayPath,
				framework: options.framework,
				validator: options.validator,
				packageManager,
				tsConfigUpdated: tsResult.status === "updated",
				skillInstalled,
			});
		} catch (error) {
			s.stop("Scaffolding failed.");
			logger.fatal("Scaffolding failed.", error);
		}
	}
}
