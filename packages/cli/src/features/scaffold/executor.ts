import fsp from "node:fs/promises";
import path from "node:path";
import { code, symbol } from "@/shared/visuals";
import type { Reporter, ScaffoldingPlan, Workspace } from "./plan";
import { getInstallCommand, getNextStepsNote } from "./utils";

/**
 * Executes a ScaffoldingPlan by performing workspace modifications,
 * installing dependencies, and bootstrapping framework configurations.
 */
export class Executor {
	constructor(
		private workspace: Workspace,
		private reporter: Reporter,
	) {}

	async execute(plan: ScaffoldingPlan) {
		const s = this.reporter.spinner();
		s.start("Scaffolding ArkEnv configuration...");

		try {
			// 0. Handle project cloning for New Project Flow
			if (plan.clone) {
				s.stop("Starting new project scaffolding...");
				this.reporter.step(`Cloning template ${code(plan.clone.template)}...`);

				const tempDir = path.join(process.cwd(), ".arkenv-temp");
				await this.workspace.mkdir(tempDir, true);

				try {
					// Clone sparsely
					await this.workspace.execute("git", [
						"clone",
						"--filter=blob:none",
						"--sparse",
						plan.clone.repository,
						tempDir,
					]);

					// Checkout the specific example
					const examplePath = `examples/${plan.clone.template}`;
					await this.workspace.execute("git", [
						"-C",
						tempDir,
						"sparse-checkout",
						"set",
						examplePath,
					]);

					// Move files to current directory
					const fullExamplePath = path.join(tempDir, examplePath);
					await copyDirectoryContents(fullExamplePath, process.cwd());

					// Remove any copied lockfiles to ensure clean install with target package manager
					const lockfiles = [
						"package-lock.json",
						"pnpm-lock.yaml",
						"yarn.lock",
						"bun.lockb",
						"bun.lock",
					];
					for (const lockfile of lockfiles) {
						await fsp.rm(path.join(process.cwd(), lockfile), { force: true });
					}

					// Update package.json name
					const pkgPath = path.join(process.cwd(), "package.json");
					if (await this.workspace.exists(pkgPath)) {
						const pkgContent = await this.workspace.readFile(pkgPath);
						const pkg = JSON.parse(pkgContent);
						pkg.name = plan.clone.targetName;
						await this.workspace.writeFile(
							pkgPath,
							JSON.stringify(pkg, null, 2),
						);
					}
				} finally {
					// Cleanup temp dir
					await fsp.rm(tempDir, { recursive: true, force: true });
				}

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

async function copyDirectoryContents(source: string, destination: string) {
	const entries = await fsp.readdir(source);
	await Promise.all(
		entries.map((entry) =>
			fsp.cp(path.join(source, entry), path.join(destination, entry), {
				recursive: true,
				force: false,
			}),
		),
	);
}
