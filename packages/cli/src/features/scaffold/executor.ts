import path from "node:path";
import { code, symbol } from "@/shared/visuals";
import { cloneTemplate } from "./cloner";
import type { Reporter, ScaffoldingPlan, Workspace } from "./plan";
import { getInstallCommand, getNextStepsNote } from "./utils";

/**
 * Executes a ScaffoldingPlan by performing workspace modifications,
 * installing dependencies, and bootstrapping framework configurations.
 */
export class Executor {
	/**
	 * Creates an executor with workspace operations and reporting for CLI users.
	 */
	constructor(
		private workspace: Workspace,
		private reporter: Reporter,
	) {}

	/**
	 * Applies a scaffolding plan to the workspace and reports next steps for CLI users.
	 */
	async execute(plan: ScaffoldingPlan) {
		const s = this.reporter.spinner();
		s.start("Scaffolding ArkEnv configuration...");

		try {
			// 0. Handle project cloning for New Project Flow
			if (plan.clone) {
				s.stop("Starting new project scaffolding...");
				this.reporter.step(`Cloning template ${code(plan.clone.template)}...`);

				await cloneTemplate(this.workspace, plan.clone);

				s.start("Scaffolding complete, finalizing...");
			}

			// 1. Create directories and write files
			for (const file of plan.files) {
				if (file.action === "append") {
					if (
						!plan.bootstrap ||
						(plan.bootstrap.framework !== "vite" &&
							plan.bootstrap.framework !== "bun-fullstack")
					) {
						this.reporter.warn(
							`Skipping safe-append for ${code(path.basename(file.path))}: unsupported framework.`,
						);
						continue;
					}
					const success = await this.workspace.safeAppend(
						file.path,
						file.content,
						plan.bootstrap.framework,
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
					`Installing dependencies with ${code(plan.install.packageManager)}...`,
				);
				const [cmd, args] = getInstallCommand(
					plan.install.packageManager,
					plan.install.dependencies,
				);
				await this.workspace.execute(cmd, args);
			}

			// 3. TS Config
			let tsConfigUpdated = false;
			if (plan.tsConfig) {
				const tsResult = await this.workspace.updateTsConfigToStrict(
					plan.tsConfig.path,
				);
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
							plan.bootstrap.importPath || "./src/env",
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
							this.reporter.info(
								`Please add ${code("@arkenv/vite-plugin")} manually.`,
							);
						}
					} else {
						this.reporter.info(
							`No Vite config found — please add ${code("@arkenv/vite-plugin")} to your Vite config manually.`,
						);
					}
				} else if (plan.bootstrap.framework === "bun-fullstack") {
					const bunConfigPath = await this.workspace.findBunConfig();
					const result = await this.workspace.bootstrapBunConfig(
						bunConfigPath,
						plan.bootstrap.bunFeatures,
					);
					if (result.success && result.instructions) {
						this.reporter.info(result.instructions);
					} else if (!result.success) {
						this.reporter.error(result.error || "Bun bootstrap failed");
					}
				}
			}

			// 5. Skill
			let skillInstalled = false;
			if (plan.skill && process.env.SKIP_INSTALL !== "true") {
				this.reporter.step("Installing ArkEnv agent skill...");
				try {
					const [cmd, ...baseArgs] = plan.skill.dlxCommand;
					const args = [...baseArgs, "skills", "add", plan.skill.packageName];
					if (plan.skill.isYes) {
						args.push("--yes");
					}
					await this.workspace.execute(cmd, args);
					skillInstalled = true;
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : String(err);
					this.reporter.warn(`Failed to install ArkEnv AI skill: ${message}`);
				}
			}

			// 6. Final reporting
			const note = getNextStepsNote(plan, skillInstalled);
			this.reporter.note(note.message, note.title);

			this.reporter.finish(
				`${symbol} ArkEnv scaffolding complete. Happy coding!`,
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
}
