import { spawn } from "node:child_process";
import path from "node:path";
import { confirm, isCancel } from "@clack/prompts";
import pc from "picocolors";
import type { CLI } from "../cli";
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
				await this.execute(installCmd);
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

			if (isQuiet) {
				child.stdout?.on("data", (data) => {
					stdout += data.toString();
				});
				child.stderr?.on("data", (data) => {
					stderr += data.toString();
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
