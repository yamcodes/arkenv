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
	partitionPresetKeys,
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

			// 3. Discover schema file(s) and layout
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
				if (discovery.layout === "strict") {
					const clientPath = path.join(discovery.dir, "client.ts");
					const serverPath = path.join(discovery.dir, "server.ts");
					const relClientPath = path.relative(cwd, clientPath);
					const relServerPath = path.relative(cwd, serverPath);

					if (
						!(await this.workspace.exists(clientPath)) ||
						!(await this.workspace.exists(serverPath))
					) {
						this.logger.error(
							`Strict layout files not found in ${path.relative(cwd, discovery.dir)}.`,
						);
						return false;
					}

					const clientCode = await this.workspace.readFile(clientPath);
					const serverCode = await this.workspace.readFile(serverPath);

					const clientValidator = detectValidator(clientCode);
					const serverValidator = detectValidator(serverCode);

					const { clientKeys, serverKeys } = partitionPresetKeys(
						provider,
						prefix,
					);

					const clientResult = applyPresetToSchema(clientCode, {
						preset: provider,
						framework,
						validator: clientValidator,
						markerId: `${provider}:client`,
						targetKeys: clientKeys,
					});

					const serverResult = applyPresetToSchema(serverCode, {
						preset: provider,
						framework,
						validator: serverValidator,
						markerId: `${provider}:server`,
						targetKeys: serverKeys,
					});

					if (!clientResult.success || !clientResult.code) {
						this.logger.error(
							clientResult.error ||
								`Failed to apply preset to ${relClientPath}.`,
						);
						return false;
					}

					if (!serverResult.success || !serverResult.code) {
						this.logger.error(
							serverResult.error ||
								`Failed to apply preset to ${relServerPath}.`,
						);
						return false;
					}

					let anyUpdated = false;
					if (clientResult.updated) {
						await this.workspace.writeFile(clientPath, clientResult.code);
						anyUpdated = true;
					}
					if (serverResult.updated) {
						await this.workspace.writeFile(serverPath, serverResult.code);
						anyUpdated = true;
					}

					if (
						typeof this.workspace.appendMissingEnvExampleKeys === "function"
					) {
						await this.workspace.appendMissingEnvExampleKeys(
							cwd,
							allPresetKeys,
						);
					}

					if (anyUpdated) {
						this.logger.success(
							`Applied ${providerName} preset to ${relClientPath} and ${relServerPath}`,
						);
					} else {
						this.logger.info(
							`${providerName} preset is already up-to-date in ${relClientPath} and ${relServerPath}`,
						);
					}

					return true;
				}

				// Flat layout
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
			if (discovery.layout === "strict") {
				const clientPath = path.join(discovery.dir, "client.ts");
				const serverPath = path.join(discovery.dir, "server.ts");
				const relClientPath = path.relative(cwd, clientPath);
				const relServerPath = path.relative(cwd, serverPath);

				if (
					!(await this.workspace.exists(clientPath)) ||
					!(await this.workspace.exists(serverPath))
				) {
					this.logger.error(
						`Strict layout files not found in ${path.relative(cwd, discovery.dir)}.`,
					);
					return false;
				}

				const clientCode = await this.workspace.readFile(clientPath);
				const serverCode = await this.workspace.readFile(serverPath);

				const clientResult = removePresetFromSchema(clientCode, {
					preset: provider,
				});
				const serverResult = removePresetFromSchema(serverCode, {
					preset: provider,
				});

				if (!clientResult.success || !clientResult.code) {
					this.logger.error(
						clientResult.error ||
							`Failed to remove preset from ${relClientPath}.`,
					);
					return false;
				}

				if (!serverResult.success || !serverResult.code) {
					this.logger.error(
						serverResult.error ||
							`Failed to remove preset from ${relServerPath}.`,
					);
					return false;
				}

				let anyUpdated = false;
				const removedKeys: string[] = [];
				if (clientResult.updated) {
					await this.workspace.writeFile(clientPath, clientResult.code);
					anyUpdated = true;
					if (clientResult.removedKeys) {
						removedKeys.push(...clientResult.removedKeys);
					}
				}
				if (serverResult.updated) {
					await this.workspace.writeFile(serverPath, serverResult.code);
					anyUpdated = true;
					if (serverResult.removedKeys) {
						removedKeys.push(...serverResult.removedKeys);
					}
				}

				if (anyUpdated) {
					// Find remaining preset keys across both files
					const validationClient = validateAndFindPresetBlocks(
						clientResult.code || clientCode,
					);
					const remainingBlocksClient = validationClient.success
						? validationClient.blocks
						: [];
					const validationServer = validateAndFindPresetBlocks(
						serverResult.code || serverCode,
					);
					const remainingBlocksServer = validationServer.success
						? validationServer.blocks
						: [];
					const remainingKeys = [
						...remainingBlocksClient.flatMap((b) => b.keys),
						...remainingBlocksServer.flatMap((b) => b.keys),
					];

					if (typeof this.workspace.removeEnvExampleKeys === "function") {
						await this.workspace.removeEnvExampleKeys(
							cwd,
							removedKeys,
							remainingKeys,
						);
					}

					this.logger.success(
						`Removed ${providerName} preset from ${relClientPath} and ${relServerPath}`,
					);
				} else {
					this.logger.info(
						`${providerName} preset was not present in ${relClientPath} and ${relServerPath}`,
					);
				}

				return true;
			}

			// Flat layout remove
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
	 * Discovers the schema target file or directory and layout strategy.
	 */
	private async discoverSchema(
		cwd: string,
		fileOverride?: string,
	): Promise<
		| { layout: "strict"; dir: string }
		| { layout: "flat"; filePath: string }
		| null
	> {
		if (fileOverride) {
			const resolved = path.resolve(cwd, fileOverride);
			// Check if it's a directory with client.ts and server.ts
			const clientFile = path.join(resolved, "client.ts");
			const serverFile = path.join(resolved, "server.ts");
			if (
				(await this.workspace.exists(clientFile)) &&
				(await this.workspace.exists(serverFile))
			) {
				return { layout: "strict", dir: resolved };
			}
			return { layout: "flat", filePath: resolved };
		}

		// Read pointer from nearest package.json
		if (typeof this.scanner.readArkenvConfig === "function") {
			const arkenvConfig = await this.scanner.readArkenvConfig(cwd);
			if (arkenvConfig) {
				const resolved = path.resolve(cwd, arkenvConfig.schema);
				if (arkenvConfig.layout === "strict") {
					return { layout: "strict", dir: resolved };
				}
				return { layout: "flat", filePath: resolved };
			}
		}

		// Fallback: check convention locations
		const strictCandidates = [
			path.resolve(cwd, "env"),
			path.resolve(cwd, "src/env"),
		];
		for (const dir of strictCandidates) {
			if (
				(await this.workspace.exists(path.join(dir, "client.ts"))) &&
				(await this.workspace.exists(path.join(dir, "server.ts")))
			) {
				return { layout: "strict", dir };
			}
		}

		const flatCandidates = [
			path.resolve(cwd, "env.ts"),
			path.resolve(cwd, "src/env.ts"),
		];
		for (const file of flatCandidates) {
			if (await this.workspace.exists(file)) {
				return { layout: "flat", filePath: file };
			}
		}

		this.logger.error(
			"Could not locate your schema file. Add an 'arkenv' entry to package.json or specify --file <path>.",
		);
		return null;
	}
}
