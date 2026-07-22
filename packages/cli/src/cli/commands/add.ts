import path from "node:path";
import { mutateEnvConfig } from "@/features/config-mutation";
import {
	getFieldDefinition,
	getFrameworkPrefix,
	getPresetKeys,
	partitionPresetKeys,
	PRESETS,
	type HostPreset,
} from "@/features/scaffold";
import type {
	LoggerPort,
	ProjectScannerPort,
	PromptPort,
	WorkspacePort,
} from "@/shared/ports";

export type AddInput = {
	provider?: Exclude<HostPreset, "none">;
	isYes?: boolean;
};

/**
 * Use case for adding a hosting preset (Vercel/Netlify/Cloudflare/etc.) to an existing schema.
 */
export class AddUseCase {
	constructor(
		private readonly logger: LoggerPort,
		private readonly workspace: WorkspacePort,
		private readonly prompt: PromptPort,
		private readonly scanner: ProjectScannerPort,
	) {}

	/**
	 * Executes the add command by finding/mutating env.ts.
	 */
	async execute(input: AddInput): Promise<boolean> {
		this.logger.interactiveStdout(true);

		try {
			let provider = input.provider;

			if (!provider) {
				if (input.isYes) {
					provider = "vercel";
				} else {
					const selected = (await this.prompt.select(
						"Select a hosting provider preset:",
						[
							{
								value: "vercel",
								label: "Vercel",
								hint: "Add VERCEL, VERCEL_ENV, VERCEL_URL, etc.",
							},
							{
								value: "netlify",
								label: "Netlify",
								hint: "Add NETLIFY, CONTEXT, URL, DEPLOY_URL, etc.",
							},
							{
								value: "cloudflare",
								label: "Cloudflare Pages/Workers",
								hint: "Add CF_PAGES, CF_PAGES_COMMIT_SHA, CF_PAGES_BRANCH, CF_PAGES_URL, etc.",
							},
							{
								value: "railway",
								label: "Railway",
								hint: "Add RAILWAY_ENVIRONMENT, RAILWAY_STATIC_URL, RAILWAY_GIT_COMMIT_SHA, etc.",
							},
							{
								value: "render",
								label: "Render",
								hint: "Add RENDER, RENDER_SERVICE_ID, RENDER_SERVICE_TYPE, RENDER_EXTERNAL_URL, etc.",
							},
							{
								value: "fly",
								label: "Fly.io",
								hint: "Add FLY_APP_NAME, FLY_REGION, FLY_ALLOC_ID, etc.",
							},
						],
						"vercel",
					)) as HostPreset;
					if (selected && selected !== "none") {
						provider = selected;
					} else {
						return false;
					}
				}
			}

			const cwd = process.cwd();
			const tsConfigResult = await this.scanner.checkTsConfig(cwd);
			const tsConfig = tsConfigResult.parsed || null;
			const framework = await this.scanner.detectFramework(cwd, tsConfig);

			const strictDirCandidates = [
				path.resolve(cwd, "env"),
				path.resolve(cwd, "src/env"),
			];

			let strictDir: string | null = null;
			for (const dir of strictDirCandidates) {
				const clientFile = path.join(dir, "client.ts");
				const serverFile = path.join(dir, "server.ts");
				if (
					(await this.workspace.exists(clientFile)) &&
					(await this.workspace.exists(serverFile))
				) {
					strictDir = dir;
					break;
				}
			}

			const prefix = getFrameworkPrefix(framework);

			if (strictDir) {
				const clientPath = path.join(strictDir, "client.ts");
				const serverPath = path.join(strictDir, "server.ts");
				const relClientPath = path.relative(cwd, clientPath);
				const relServerPath = path.relative(cwd, serverPath);

				const { clientKeys, serverKeys } = partitionPresetKeys(
					provider,
					framework,
				);

				const clientCode = await this.workspace.readFile(clientPath);
				const serverCode = await this.workspace.readFile(serverPath);

				const clientValidator = detectValidator(clientCode);
				const serverValidator = detectValidator(serverCode);

				const clientResult = mutateEnvConfig(
					clientCode,
					provider,
					framework,
					clientValidator,
					clientKeys,
				);
				const serverResult = mutateEnvConfig(
					serverCode,
					provider,
					framework,
					serverValidator,
					serverKeys,
				);

				const getStrictManualText = (): string => {
					const clientText = clientKeys
						.map(
							(key) =>
								`\t${key}: ${getFieldDefinition(key, clientValidator, prefix)},`,
						)
						.join("\n");
					const serverText = serverKeys
						.map(
							(key) =>
								`\t${key}: ${getFieldDefinition(key, serverValidator, prefix)},`,
						)
						.join("\n");
					return `// ${relClientPath}\n{\n${clientText}\n}\n\n// ${relServerPath}\n{\n${serverText}\n}`;
				};

				if (
					!clientResult.success ||
					!clientResult.code ||
					!serverResult.success ||
					!serverResult.code
				) {
					this.logger.error("Failed to mutate strict layout schema files.");
					this.logger.log(
						"\nPlease add the following environment variables to your schemas manually:\n",
					);
					this.logger.log(getStrictManualText());
					return true;
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

				const providerName = PRESETS[provider].label;
				if (anyUpdated) {
					this.logger.success(
						`Added ${providerName} environment variables to ${relClientPath} and ${relServerPath}`,
					);
				} else {
					this.logger.info(
						`All ${providerName} environment variables are already present in ${relClientPath} and ${relServerPath}`,
					);
				}

				return true;
			}

			const suggestedPath = await this.scanner.suggestDefaultEnvPath(
				cwd,
				tsConfig,
			);
			const candidatePaths = [
				path.resolve(cwd, "env.ts"),
				path.resolve(cwd, "src/env.ts"),
				path.resolve(cwd, suggestedPath),
			];

			let envPath: string | null = null;
			for (const candidate of candidatePaths) {
				if (await this.workspace.exists(candidate)) {
					envPath = candidate;
					break;
				}
			}
			const keys = getPresetKeys(provider, prefix);

			const getManualFieldsText = (
				validator: "zod" | "valibot" | "arktype",
			): string => {
				return keys
					.map(
						(key) => `\t${key}: ${getFieldDefinition(key, validator, prefix)},`,
					)
					.join("\n");
			};

			if (!envPath) {
				this.logger.error("Could not locate your env.ts file.");
				this.logger.log(
					"\nPlease add the following environment variables to your schema manually:\n",
				);
				this.logger.log(`{\n${getManualFieldsText("arktype")}\n}`);
				return true;
			}

			const code = await this.workspace.readFile(envPath);
			const validator = detectValidator(code);
			const result = mutateEnvConfig(code, provider, framework, validator);

			const relativeEnvPath = path.relative(cwd, envPath);

			if (!result.success || !result.code) {
				this.logger.error(
					result.error || `Failed to mutate ${relativeEnvPath}.`,
				);
				this.logger.log(
					"\nPlease add the following environment variables to your schema manually:\n",
				);
				this.logger.log(`{\n${getManualFieldsText(validator)}\n}`);
				return true;
			}

			if (result.updated) {
				await this.workspace.writeFile(envPath, result.code);
				this.logger.success(
					`Added ${PRESETS[provider].label} environment variables to ${relativeEnvPath}`,
				);
			} else {
				this.logger.info(
					`All ${PRESETS[provider].label} environment variables are already present in ${relativeEnvPath}`,
				);
			}

			return true;
		} finally {
			this.logger.interactiveStdout(false);
		}
	}
}

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
