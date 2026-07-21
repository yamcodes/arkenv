import path from "node:path";
import {
	getFieldDefinition,
	mutateEnvConfig,
} from "@/features/config-mutation";
import { FRAMEWORK_CLIENT_PREFIXES } from "@/features/scaffold/frameworks";
import type { Validator } from "@/features/scaffold/plan";
import {
	getPresetKeys,
	partitionPresetKeys,
} from "@/features/scaffold/presets";
import type {
	LoggerPort,
	ProjectScannerPort,
	PromptPort,
	WorkspacePort,
} from "@/shared/ports";

export type AddInput = {
	provider?: "vercel" | "netlify";
	isYes?: boolean;
};

/**
 * Use case for adding a hosting preset (Vercel/Netlify) to an existing schema.
 */
export class AddUseCase {
	constructor(
		private readonly logger: LoggerPort,
		private readonly workspace: WorkspacePort,
		private readonly prompt: PromptPort,
		private readonly scanner: ProjectScannerPort,
	) {}

	/**
	 * Executes the add command by finding/mutating the env schema.
	 */
	async execute(input: AddInput): Promise<boolean> {
		this.logger.interactiveStdout(true);

		try {
			let provider = input.provider;

			if (!provider) {
				if (input.isYes) {
					provider = "vercel";
				} else {
					const selected = await this.prompt.select(
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
						],
						"vercel",
					);
					if (selected === "vercel" || selected === "netlify") {
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

			const prefix = FRAMEWORK_CLIENT_PREFIXES[framework];

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
								`\t${key}: ${getFieldDefinition(key, clientValidator, prefix, provider)},`,
						)
						.join("\n");
					const serverText = serverKeys
						.map(
							(key) =>
								`\t${key}: ${getFieldDefinition(key, serverValidator, prefix, provider)},`,
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

				const providerName = provider === "vercel" ? "Vercel" : "Netlify";
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

			const getManualFieldsText = (validator: Validator): string => {
				return keys
					.map(
						(key) =>
							`\t${key}: ${getFieldDefinition(key, validator, prefix, provider)},`,
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
					`Added ${provider === "vercel" ? "Vercel" : "Netlify"} environment variables to ${relativeEnvPath}`,
				);
			} else {
				this.logger.info(
					`All ${provider === "vercel" ? "Vercel" : "Netlify"} environment variables are already present in ${relativeEnvPath}`,
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
export function detectValidator(code: string): Validator {
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
