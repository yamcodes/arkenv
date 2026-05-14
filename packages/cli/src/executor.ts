import path from "node:path";
import dedent from "dedent";
import pc from "picocolors";
import type { Reporter, ScaffoldingPlan, Workspace } from "./plan";
import { code, symbol } from "./visuals";

export class Executor {
	constructor(
		private workspace: Workspace,
		private reporter: Reporter,
	) {}

	async execute(plan: ScaffoldingPlan) {
		const s = this.reporter.spinner();
		s.start("Scaffolding ArkEnv configuration...");

		try {
			// 1. Create directories and write files
			for (const file of plan.files) {
				if (file.action === "append") {
					const success = await this.workspace.safeAppend(
						file.path,
						file.content,
						plan.bootstrap?.framework as "vite" | "bun",
					);
					if (success) {
						this.reporter.info(
							`Appended ArkEnv types to ${code(path.basename(file.path))}.`,
						);
					} else {
						this.reporter.info(
							`${code(path.basename(file.path))} already contains ArkEnv types.`,
						);
					}
					continue;
				}

				await this.workspace.mkdir(path.dirname(file.path), true);
				await this.workspace.writeFile(file.path, file.content);

				if (file.label === "environment schema") {
					// We'll report this at the end or as we go
				} else if (file.label?.includes("types")) {
					const actionLabel =
						file.action === "overwrite" ? "Updated" : "Created";
					this.reporter.info(
						`${actionLabel} ${code(path.basename(file.path))} for typesafe environment variables.`,
					);
				}
			}

			s.stop("Configuration scaffolded!");

			// 2. Install dependencies
			if (plan.install && process.env.SKIP_INSTALL !== "true") {
				this.reporter.step(
					`Installing dependencies with ${plan.install.packageManager}...`,
				);
				const installCmd = this.getInstallCommand(
					plan.install.packageManager,
					plan.install.dependencies,
				);
				await this.workspace.execute(installCmd);
			}

			// 3. TS Config
			let tsConfigUpdated = false;
			if (plan.tsConfig) {
				const tsResult = await this.workspace.updateTsConfigToStrict();
				if (tsResult.status === "updated") {
					this.reporter.info(
						`Enforced strict: true in your ${code(tsResult.file!)}`,
					);
					tsConfigUpdated = true;
				} else if (tsResult.status === "error") {
					this.reporter.warn(
						`Could not automatically update ${code(tsResult.file || "tsconfig.json")}. Please ensure 'strict: true' is set manually.`,
					);
				}
			}

			// 4. Framework bootstrapping
			if (plan.bootstrap) {
				if (plan.bootstrap.framework === "vite") {
					const viteConfigPath = await this.workspace.findViteConfig();
					if (viteConfigPath) {
						this.reporter.step("Bootstrapping Vite plugin...");
						const result = await this.workspace.bootstrapViteConfig(
							viteConfigPath,
							plan.bootstrap.importPath!,
						);
						if (result.success) {
							if (result.updated) {
								this.reporter.info(
									`Updated ${code(path.basename(viteConfigPath))}`,
								);
							}
						} else {
							this.reporter.warn(
								`Could not automatically update ${code(path.basename(viteConfigPath))}: ${result.error}`,
							);
							this.reporter.info("Please add '@arkenv/vite-plugin' manually.");
						}
					} else {
						this.reporter.info(
							"No Vite config found — please add '@arkenv/vite-plugin' to your Vite config manually.",
						);
					}
				} else if (plan.bootstrap.framework === "bun") {
					const bunConfigPath = await this.workspace.findBunConfig();
					if (bunConfigPath) {
						const result =
							await this.workspace.bootstrapBunConfig(bunConfigPath);
						if (result.success && result.instructions) {
							this.reporter.info(result.instructions);
						} else if (!result.success) {
							this.reporter.error(result.error || "Bun bootstrap failed");
						}
					}
				}
			}

			// 5. Skill
			let skillInstalled = false;
			if (plan.skill && process.env.SKIP_INSTALL !== "true") {
				this.reporter.step("Installing ArkEnv agent skill...");
				try {
					const yesFlag = plan.skill.isYes ? " --yes" : "";
					await this.workspace.execute(
						`${plan.skill.dlxCommand} skills add ${plan.skill.packageName}${yesFlag}`,
					);
					skillInstalled = true;
				} catch (err: any) {
					this.reporter.warn(
						`Failed to install ArkEnv AI skill: ${err.message}`,
					);
				}
			}

			// 6. Final reporting
			this.reportNextSteps(plan, skillInstalled);

			this.reporter.finish(
				`${symbol} ArkEnv scaffolding complete. ${pc.dim("Happy coding!")}`,
				{
					path: plan.metadata.displayPath,
					framework: plan.metadata.framework,
					validator: plan.metadata.validator,
					packageManager: plan.metadata.packageManager,
					tsConfigUpdated,
					skillInstalled,
				},
			);
		} catch (error) {
			s.stop("Scaffolding failed.");
			throw error;
		}
	}

	private getInstallCommand(pm: string, deps: string[]): string {
		switch (pm) {
			case "pnpm":
				return `pnpm add ${deps.join(" ")}`;
			case "yarn":
				return `yarn add ${deps.join(" ")}`;
			case "bun":
				return `bun add ${deps.join(" ")}`;
			default:
				return `npm install ${deps.join(" ")}`;
		}
	}

	private reportNextSteps(plan: ScaffoldingPlan, skillInstalled: boolean) {
		let usageInstructions = `2. Import and use: ${code(`import { env } from "${plan.metadata.importPath}"`)}`;
		if (plan.metadata.framework === "vite") {
			usageInstructions = `2. Access via ${code("import.meta.env.YOUR_VAR")}`;
		} else if (plan.metadata.framework === "bun") {
			usageInstructions = `2. Access via ${code("process.env.YOUR_VAR")}`;
		}

		if (skillInstalled) {
			this.reporter.note(
				dedent`
					Inside your AI assistant (e.g. Claude Code), use:
					${pc.cyan("/arkenv")} - automatically refine your schema and configure integrations.
				`,
				"Next steps",
			);
		} else {
			const dlx = plan.skill?.dlxCommand || "npx";
			this.reporter.note(
				dedent`
					1. Check ${code(plan.metadata.displayPath)} and refine your environment schema.
					${usageInstructions}
					3. (Recommended) Install the AI skill: ${code(`${dlx} skills add yamcodes/arkenv`)}
					   Then run ${pc.cyan("/arkenv")} inside your AI assistant to finish.
				`,
				"Next steps",
			);
		}
	}
}
