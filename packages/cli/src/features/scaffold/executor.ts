import path from "node:path";
import { isMap, parseDocument } from "yaml";
import { code, symbol } from "@/shared/visuals";
import { cloneExample } from "./cloner";
import type { Reporter, ScaffoldingPlan, Workspace } from "./plan";
import { getInstallCommand, getNextStepsNote } from "./utils";

const APPROVED_PNPM_BUILDS = ["esbuild"];

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
				this.reporter.step(`Cloning example ${code(plan.clone.example)}...`);

				await cloneExample(this.workspace, plan.clone);

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
				if (plan.install.packageManager === "pnpm") {
					await this.configurePnpmBuilds(plan.install.cwd ?? plan.cwd);
				}
				this.reporter.step(
					`Installing dependencies with ${code(plan.install.packageManager)}...`,
				);
				const [cmd, args] = getInstallCommand(
					plan.install.packageManager,
					plan.install.dependencies,
				);
				await this.workspace.execute(cmd, args, plan.install.cwd ?? plan.cwd);
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
			let frameworkConfigBootstrapped = false;
			if (plan.bootstrap) {
				if (plan.bootstrap.framework === "vite") {
					const viteConfigPath = await this.workspace.findViteConfig(plan.cwd);
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
							`No Vite config found - please add ${code("@arkenv/vite-plugin")} to your Vite config manually.`,
						);
					}
				} else if (plan.bootstrap.framework === "bun-fullstack") {
					const bunConfigPath = await this.workspace.findBunConfig(plan.cwd);
					const result = await this.workspace.bootstrapBunConfig(
						bunConfigPath,
						plan.bootstrap.bunFeatures,
					);
					if (result.success && result.instructions) {
						this.reporter.info(result.instructions);
					} else if (!result.success) {
						this.reporter.error(result.error || "Bun bootstrap failed");
					}
				} else if (plan.bootstrap.framework === "nextjs") {
					// Only generate env.gen.ts when codegen is enabled
					if (!plan.bootstrap.disableCodegen) {
						this.reporter.step("Generating Next.js environment bindings...");
						const script = `import('@arkenv/nextjs/config').then(({ runCodegen }) => { const path = require('path'); const schemaPath = path.resolve(process.cwd(), '${plan.metadata.displayPath}'); const outputPath = path.join(path.dirname(schemaPath), 'generated', 'env.gen.ts'); runCodegen(schemaPath, outputPath); }).catch(err => { console.error(err); process.exit(1); });`;
						try {
							await this.workspace.execute("node", ["-e", script], plan.cwd);
							this.reporter.info(`Generated ${code("env.gen.ts")} for Next.js`);
						} catch (error) {
							this.reporter.warn(
								`Failed to automatically generate ${code("env.gen.ts")}. It will be generated when you start your dev server.`,
							);
						}
					}

					// Bootstrap Next.js config wrapper
					if (plan.bootstrap.wrapNextjsConfig !== false) {
						this.reporter.step("Bootstrapping Next.js config...");
						const nextjsConfigPath = await this.workspace.findNextjsConfig(
							plan.cwd,
						);
						if (nextjsConfigPath) {
							const result = await this.workspace.bootstrapNextjsConfig(
								nextjsConfigPath,
								plan.bootstrap.disableCodegen,
							);
							if (result.success) {
								if (result.updated) {
									this.reporter.info(
										`Updated ${code(path.basename(nextjsConfigPath))}`,
									);
									frameworkConfigBootstrapped = true;
								} else {
									this.reporter.info(
										`${code(path.basename(nextjsConfigPath))} already uses withArkEnv`,
									);
									frameworkConfigBootstrapped = true;
								}
							} else {
								this.reporter.warn(
									`Could not automatically update ${code(path.basename(nextjsConfigPath))}: ${result.error}`,
								);
							}
						} else {
							this.reporter.info(
								`No Next.js config found. Please wrap your config with ${code("withArkEnv")} manually.`,
							);
						}
					}
				} else if (plan.bootstrap.framework === "nuxt") {
					// Bootstrap Nuxt config wrapper
					this.reporter.step("Bootstrapping Nuxt config...");
					const nuxtConfigPath = await this.workspace.findNuxtConfig(plan.cwd);
					if (nuxtConfigPath) {
						const result =
							await this.workspace.bootstrapNuxtConfig(nuxtConfigPath);
						if (result.success) {
							if (result.updated) {
								this.reporter.info(
									`Updated ${code(path.basename(nuxtConfigPath))}`,
								);
							} else {
								this.reporter.info(
									`${code(path.basename(nuxtConfigPath))} already registers @arkenv/nuxt/module`,
								);
							}
							frameworkConfigBootstrapped = true;
						} else {
							this.reporter.warn(
								`Could not automatically update ${code(path.basename(nuxtConfigPath))}: ${result.error}`,
							);
						}
					} else {
						this.reporter.info(
							`No Nuxt config found. Please register ${code("@arkenv/nuxt/module")} manually.`,
						);
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
					await this.workspace.execute(cmd, args, plan.cwd);
					skillInstalled = true;
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : String(err);
					this.reporter.warn(`Failed to install ArkEnv AI skill: ${message}`);
				}
			}

			// 6. Final reporting
			const note = getNextStepsNote(
				plan,
				skillInstalled,
				frameworkConfigBootstrapped,
			);
			this.reporter.note(note.message, note.title);

			if (plan.metadata.layout === "strict") {
				const oldEnvPath = path.resolve(plan.cwd, plan.metadata.displayPath);
				if (await this.workspace.exists(oldEnvPath)) {
					const displayFile = plan.metadata.displayPath;
					const baseName = path.basename(
						displayFile,
						path.extname(displayFile),
					);
					this.reporter.warn(
						`Found existing single-file schema at ${code(displayFile)}. You can delete it after updating your imports to point to your new ${code(`${baseName}/client`)} and ${code(`${baseName}/server`)}.`,
					);
				}
			}

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

	/**
	 * Configure pnpm-specific whitelisting for esbuild and other native build dependencies.
	 *
	 * @param installCwd The directory where the installation will run
	 */
	private async configurePnpmBuilds(installCwd: string): Promise<void> {
		const packageJsonPath = path.join(installCwd, "package.json");
		if (await this.workspace.exists(packageJsonPath)) {
			try {
				const pkgContent = await this.workspace.readFile(packageJsonPath);
				const pkg = JSON.parse(pkgContent);
				pkg.pnpm = pkg.pnpm || {};
				pkg.pnpm.onlyBuiltDependencies = pkg.pnpm.onlyBuiltDependencies || [];
				for (const dep of APPROVED_PNPM_BUILDS) {
					if (!pkg.pnpm.onlyBuiltDependencies.includes(dep)) {
						pkg.pnpm.onlyBuiltDependencies.push(dep);
					}
				}
				await this.workspace.writeFile(
					packageJsonPath,
					JSON.stringify(pkg, null, 2) + "\n",
				);
			} catch (e) {
				this.reporter.warn(
					`Could not update package.json with pnpm whitelisting: ${e}`,
				);
			}
		}

		const pnpmWorkspacePath = path.join(installCwd, "pnpm-workspace.yaml");
		let workspaceContent = "";
		if (await this.workspace.exists(pnpmWorkspacePath)) {
			try {
				workspaceContent = await this.workspace.readFile(pnpmWorkspacePath);
			} catch (e) {
				// Ignore and treat as empty/non-existent
			}
		}

		const updatedContent = this.updatePnpmWorkspaceYaml(workspaceContent);
		try {
			await this.workspace.writeFile(pnpmWorkspacePath, updatedContent);
		} catch (e) {
			this.reporter.warn(`Could not write pnpm-workspace.yaml: ${e}`);
		}
	}

	/**
	 * Update the content of a pnpm-workspace.yaml file to allow approved builds.
	 *
	 * @param content The original content of the pnpm-workspace.yaml file
	 * @returns The updated content with allowBuilds populated
	 */
	private updatePnpmWorkspaceYaml(content: string): string {
		const doc = parseDocument(content || "");

		if (!doc.has("allowBuilds")) {
			doc.set("allowBuilds", doc.createNode({}));
		}

		let allowBuilds = doc.get("allowBuilds");

		if (!isMap(allowBuilds)) {
			doc.set("allowBuilds", doc.createNode({}));
			allowBuilds = doc.get("allowBuilds");
		}

		if (isMap(allowBuilds)) {
			for (const dep of APPROVED_PNPM_BUILDS) {
				if (allowBuilds.get(dep) !== true) {
					allowBuilds.set(dep, true);
				}
			}
		}

		return String(doc);
	}
}
