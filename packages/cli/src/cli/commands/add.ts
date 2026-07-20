import path from "node:path";
import { mutateEnvConfig } from "@/features/config-mutation";
import {
	getFieldDefinition,
	getFrameworkPrefix,
	getPresetKeys,
} from "@/features/scaffold/templates/presets";
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
 * Use case for adding a hosting preset (Vercel/Netlify) to an existing env.ts schema.
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

			const prefix = getFrameworkPrefix(framework);
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
export function detectValidator(code: string): "zod" | "valibot" | "arktype" {
	const cleanedCode = code
		.replace(/\/\/.*/g, "")
		.replace(/\/\*[\s\S]*?\*\//g, "");

	if (/(?:^|\n)\s*import\s+.*?from\s+['"]zod['"]/.test(cleanedCode)) {
		return "zod";
	}
	if (/(?:^|\n)\s*import\s+.*?from\s+['"]valibot['"]/.test(cleanedCode)) {
		return "valibot";
	}
	return "arktype";
}
