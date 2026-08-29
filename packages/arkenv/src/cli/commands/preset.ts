import path from "node:path";
import {
	applyPresetToSchema,
	removePresetFromSchema,
	validateAndFindPresetBlocks,
} from "@/features/config-mutation";
import { FRAMEWORK_CLIENT_PREFIXES } from "@/features/scaffold/frameworks";
import {
	getPresetKeys,
	type HostPreset,
	type HostProvider,
	PRESETS,
} from "@/features/scaffold/presets";
import { ERROR_CODES } from "@/shared/errors";
import type {
	LoggerPort,
	ProjectScannerPort,
	PromptPort,
	WorkspacePort,
} from "@/shared/ports";

/**
 * Detects the validator engine (Zod, Valibot, or ArkType) used in an env.ts schema file.
 * Strips single-line and multi-line comments to avoid misclassifying commented-out code or string literals.
 *
 * @param code The source code of env.ts.
 * @returns The detected validator engine.
 */
export function detectValidator(code: string): "zod" | "valibot" | "arktype" {
	const cleanedCode = code
		.replace(/\/\/.*/g, "")
		.replace(/\/\*[\s\S]*?\*\//g, "");

	if (/(?:^|\n)\s*import\s+[\s\S]*?from\s+['"]zod['"]/.test(cleanedCode)) {
		return "zod";
	}
	if (/(?:^|\n)\s*import\s+[\s\S]*?from\s+['"]valibot['"]/.test(cleanedCode)) {
		return "valibot";
	}
	return "arktype";
}

/**
 * Input for the preset command.
 */
export type PresetInput = {
	action: "apply" | "remove";
	provider?: HostProvider;
	file?: string;
	isForce?: boolean;
	isYes?: boolean;
};

/**
 * Use case for managing hosting presets (apply / remove / refresh).
 */
export class PresetUseCase {
	constructor(
		private readonly logger: LoggerPort,
		private readonly workspace: WorkspacePort,
		private readonly prompt: PromptPort,
		private readonly scanner: ProjectScannerPort,
	) {}

	/**
	 * Executes the preset apply or remove command.
	 */
	async execute(input: PresetInput): Promise<boolean> {
		this.logger.interactiveStdout(true);

		try {
			const cwd = process.cwd();

			// 1. Git working tree check
			const gitStatus = await this.scanner.checkGitStatus(cwd);
			if (gitStatus.status === "dirty") {
				if (input.isForce) {
					this.logger.warn(
						"Git working tree is not clean, but continuing due to --force flag.",
					);
				} else {
					this.logger.error(
						"Git working tree is not clean. Commit or stash your changes before running arkenv preset.",
					);
					this.logger.info("Use --force to bypass this check.");
					this.logger.refuse(
						{
							code: ERROR_CODES.GIT_TREE_DIRTY,
							message: "Git working tree is not clean.",
							why: "Commit or stash your changes before running arkenv preset.",
							retryWith: ["--force"],
							nextActions: [
								{
									kind: "run-command",
									label: "Re-run with --force to bypass git working tree check",
									command: `{bin} preset ${input.action} --force`,
								},
							],
						},
						"preset",
					);
					return false;
				}
			} else if (gitStatus.status === "unknown") {
				this.logger.warn(
					"Git working tree status could not be determined. Proceeding with caution.",
				);
			}

			// 2. Resolve Provider
			let provider = input.provider;
			if (!provider) {
				if (input.isYes) {
					provider = "vercel";
				} else {
					const actionLabel = input.action === "remove" ? "remove" : "apply";
					const selected = (await this.prompt.select(
						`Select a hosting provider preset to ${actionLabel}:`,
						Object.entries(PRESETS).map(([value, def]) => ({
							value,
							label: def.label,
							hint: def.hint,
						})),
						"vercel",
					)) as HostPreset;
					if (selected && selected !== "none") {
						provider = selected;
					} else {
						return false;
					}
				}
			}

			const providerName = PRESETS[provider]?.label || provider;

			// 3. Discover schema file
			const discovery = await this.discoverSchema(cwd, input.file);
			if (!discovery) {
				return false;
			}

			const tsConfigResult = await this.scanner.checkTsConfig(cwd);
			const tsConfig = tsConfigResult.parsed || null;
			const framework = await this.scanner.detectFramework(cwd, tsConfig);
			const prefix = FRAMEWORK_CLIENT_PREFIXES[framework] || "";

			const allPresetKeys = getPresetKeys(provider, prefix);

			if (input.action === "apply") {
				const envPath = discovery.filePath;
				const relEnvPath = path.relative(cwd, envPath);

				if (!(await this.workspace.exists(envPath))) {
					this.logger.error(`Schema file not found at ${relEnvPath}.`);
					return false;
				}

				const code = await this.workspace.readFile(envPath);
				const validator = detectValidator(code);

				const result = applyPresetToSchema(code, {
					preset: provider,
					framework,
					validator,
				});

				if (!result.success || !result.code) {
					this.logger.error(
						result.error || `Failed to apply preset to ${relEnvPath}.`,
					);
					return false;
				}

				if (result.updated) {
					await this.workspace.writeFile(envPath, result.code);
					this.logger.success(
						`Applied ${providerName} preset to ${relEnvPath}`,
					);
				} else {
					this.logger.info(
						`${providerName} preset is already up-to-date in ${relEnvPath}`,
					);
				}

				if (typeof this.workspace.appendMissingEnvExampleKeys === "function") {
					await this.workspace.appendMissingEnvExampleKeys(cwd, allPresetKeys);
				}
				return true;
			}

			// input.action === "remove"
			const envPath = discovery.filePath;
			const relEnvPath = path.relative(cwd, envPath);

			if (!(await this.workspace.exists(envPath))) {
				this.logger.error(`Schema file not found at ${relEnvPath}.`);
				return false;
			}

			const code = await this.workspace.readFile(envPath);
			const result = removePresetFromSchema(code, {
				preset: provider,
			});

			if (!result.success || !result.code) {
				this.logger.error(
					result.error || `Failed to remove preset from ${relEnvPath}.`,
				);
				return false;
			}

			if (result.updated) {
				await this.workspace.writeFile(envPath, result.code);

				const validation = validateAndFindPresetBlocks(result.code);
				const remainingBlocks = validation.success ? validation.blocks : [];
				const remainingKeys = remainingBlocks.flatMap((b) => b.keys);

				if (typeof this.workspace.removeEnvExampleKeys === "function") {
					await this.workspace.removeEnvExampleKeys(
						cwd,
						result.removedKeys || [],
						remainingKeys,
					);
				}

				this.logger.success(
					`Removed ${providerName} preset from ${relEnvPath}`,
				);
			} else {
				this.logger.info(
					`${providerName} preset was not present in ${relEnvPath}`,
				);
			}

			return true;
		} finally {
			this.logger.interactiveStdout(false);
		}
	}

	/**
	 * Discovers the flat schema file path.
	 */
	private async discoverSchema(
		cwd: string,
		fileOverride?: string,
	): Promise<{ filePath: string } | null> {
		if (fileOverride) {
			return { filePath: path.resolve(cwd, fileOverride) };
		}

		// Read pointer from nearest package.json
		if (typeof this.scanner.readArkenvConfig === "function") {
			const arkenvConfig = await this.scanner.readArkenvConfig(cwd);
			if (arkenvConfig) {
				return { filePath: path.resolve(cwd, arkenvConfig.schema) };
			}
		}

		const flatCandidates = [
			path.resolve(cwd, "env.ts"),
			path.resolve(cwd, "src/env.ts"),
		];
		for (const file of flatCandidates) {
			if (await this.workspace.exists(file)) {
				return { filePath: file };
			}
		}

		this.logger.error(
			"Could not locate your schema file. Add an 'arkenv' entry to package.json or specify --file <path>.",
		);
		return null;
	}
}
