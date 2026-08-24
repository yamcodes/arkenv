import path from "node:path";
import {
	detectLegacyProject,
	type FileMigrationChange,
	migrateDtsCode,
	migrateEnvCode,
	migratePackageJsonCode,
	migrateViteConfigCode,
} from "@/features/migration";
import type { LoggerPort, PromptPort, WorkspacePort } from "@/shared/ports";
import { code, symbol } from "@/shared/visuals";

/**
 * Input parameters for the 'migrate' command.
 */
export type MigrateInput = {
	isDryRun?: boolean;
	isYes?: boolean;
	isQuiet?: boolean;
	isAgent?: boolean;
	isForce?: boolean;
};

/**
 * Use case for migrating projects from v0 (schema/define) to v1 canonical env-object surface.
 */
export class MigrateUseCase {
	constructor(
		private readonly logger: LoggerPort,
		private readonly workspace: WorkspacePort,
		private readonly prompt: PromptPort,
	) {}

	/**
	 * Executes the v0 to v1 migration.
	 */
	async execute(input: MigrateInput = {}): Promise<boolean> {
		const cwd = process.cwd();
		const isDryRun = Boolean(input.isDryRun);
		const isYes = Boolean(input.isYes || input.isAgent);

		this.logger.step(
			isDryRun
				? "Analyzing project for v0 → v1 migration (dry-run)..."
				: "Scanning project for v0 → v1 migration...",
		);

		// 1. Locate relevant files
		const envCandidates = [
			path.join(cwd, "src/env.ts"),
			path.join(cwd, "env.ts"),
			path.join(cwd, "src/env/index.ts"),
			path.join(cwd, "env/index.ts"),
		];

		let envFilePath: string | undefined;
		let envCode: string | undefined;

		for (const candidate of envCandidates) {
			if (await this.workspace.exists(candidate)) {
				envFilePath = candidate;
				envCode = await this.workspace.readFile(candidate);
				break;
			}
		}

		const viteConfigPath = await this.workspace.findViteConfig(cwd);
		const viteConfigCode = viteConfigPath
			? await this.workspace.readFile(viteConfigPath)
			: undefined;

		const dtsCandidates = [
			path.join(cwd, "src/vite-env.d.ts"),
			path.join(cwd, "vite-env.d.ts"),
			path.join(cwd, "src/bun-env.d.ts"),
			path.join(cwd, "bun-env.d.ts"),
		];

		let dtsFilePath: string | undefined;
		let dtsCode: string | undefined;

		for (const candidate of dtsCandidates) {
			if (await this.workspace.exists(candidate)) {
				dtsFilePath = candidate;
				dtsCode = await this.workspace.readFile(candidate);
				break;
			}
		}

		const packageJsonPath = path.join(cwd, "package.json");
		const hasPackageJson = await this.workspace.exists(packageJsonPath);
		const packageJsonCode = hasPackageJson
			? await this.workspace.readFile(packageJsonPath)
			: undefined;

		// 2. Detect legacy patterns
		const detection = detectLegacyProject({
			envCode,
			viteConfigCode,
			dtsCode,
			packageJsonCode,
		});

		if (!detection.isLegacy) {
			this.logger.info(
				`${symbol} No legacy v0 patterns detected. Your project is already on the v1 canonical env-object surface!`,
			);
			return true;
		}

		this.logger.info("Detected legacy v0 patterns:");
		for (const reason of detection.reasons) {
			this.logger.info(`  • ${reason}`);
		}

		const changes: FileMigrationChange[] = [];
		const manualInstructions: string[] = [];
		const errors: string[] = [];

		// 3. Plan migrations
		if (envFilePath && envCode && detection.hasLegacyEnvFile) {
			const res = migrateEnvCode(envCode);
			if (res.error) {
				errors.push(
					`Failed to migrate ${path.basename(envFilePath)}: ${res.error}`,
				);
				manualInstructions.push(
					`In ${code(path.basename(envFilePath))}, rewrite \`export const Env = type({...})\` to \`export const env = arkenv({...})\` manually.`,
				);
			} else if (res.updated) {
				changes.push({
					filePath: envFilePath,
					originalContent: envCode,
					updatedContent: res.code,
					hasChanged: true,
					description:
						"Rewrite schema to canonical `export const env = arkenv({...})`",
				});
			}
		}

		if (viteConfigPath && viteConfigCode && detection.hasLegacyViteConfig) {
			const res = migrateViteConfigCode(viteConfigCode);
			if (res.error) {
				errors.push(
					`Failed to migrate ${path.basename(viteConfigPath)}: ${res.error}`,
				);
				manualInstructions.push(
					`In ${code(path.basename(viteConfigPath))}, remove \`import { Env }\` and use \`arkenvVitePlugin()\` without arguments.`,
				);
			} else if (res.updated) {
				changes.push({
					filePath: viteConfigPath,
					originalContent: viteConfigCode,
					updatedContent: res.code,
					hasChanged: true,
					description:
						"Remove `Env` import and use zero-arg `arkenvVitePlugin()`",
				});
			}
		}

		let shouldDeleteDts = false;
		if (dtsFilePath && dtsCode && detection.hasLegacyDtsFile) {
			const res = migrateDtsCode(dtsCode);
			shouldDeleteDts = res.shouldDelete;
			if (res.updated) {
				changes.push({
					filePath: dtsFilePath,
					originalContent: dtsCode,
					updatedContent: res.code,
					hasChanged: true,
					description: shouldDeleteDts
						? "Remove unused ambient type declarations"
						: "Strip legacy ArkEnv ambient type augmentations",
				});
			}
		}

		if (packageJsonPath && packageJsonCode && detection.hasLegacyPackageJson) {
			const isZodOrValibot =
				(envCode && (envCode.includes("zod") || envCode.includes("valibot"))) ??
				false;
			const targetPackage = isZodOrValibot
				? "@arkenv/standard"
				: "@arkenv/core";
			const res = migratePackageJsonCode(packageJsonCode, targetPackage);
			if (res.error) {
				errors.push(`Failed to migrate package.json: ${res.error}`);
				manualInstructions.push(
					`In \`package.json\`, replace the \`"arkenv"\` dependency with \`"${targetPackage}"\`.`,
				);
			} else if (res.updated) {
				changes.push({
					filePath: packageJsonPath,
					originalContent: packageJsonCode,
					updatedContent: res.code,
					hasChanged: true,
					description: `Replace legacy "arkenv" dependency with "${targetPackage}"`,
				});
			}
		}

		// 4. Report proposed changes
		this.logger.step(`Proposed migration changes (${changes.length} files):`);
		for (const change of changes) {
			const relPath = path.relative(cwd, change.filePath);
			this.logger.info(`  ${code(relPath)}: ${change.description}`);
		}

		if (isDryRun) {
			this.logger.info("\nDry run completed. No files were modified.");
			return true;
		}

		// 5. Prompt for confirmation if not --yes
		if (!isYes) {
			const confirmed = await this.prompt.confirm(
				"Apply these migration changes now?",
				true,
				"Yes (Apply changes)",
			);
			if (!confirmed) {
				this.logger.cancel("Migration cancelled.");
				return false;
			}
		}

		// 6. Execute file writes
		for (const change of changes) {
			if (change.filePath === dtsFilePath && shouldDeleteDts) {
				// Delete file if empty and no other declarations exist
				try {
					await this.workspace.writeFile(change.filePath, "");
				} catch {
					// Ignore deletion error
				}
			} else {
				await this.workspace.writeFile(change.filePath, change.updatedContent);
			}
		}

		if (errors.length > 0) {
			for (const err of errors) {
				this.logger.warn(err);
			}
		}

		if (manualInstructions.length > 0) {
			this.logger.warn("\nManual adjustments needed:");
			for (const inst of manualInstructions) {
				this.logger.info(`  • ${inst}`);
			}
		}

		this.logger.finish(
			`${symbol} Migration to v1 complete! Next step: replace any \`import.meta.env.*\` or \`process.env.*\` access with \`import { env } from "./env"\`.`,
		);

		return true;
	}
}
