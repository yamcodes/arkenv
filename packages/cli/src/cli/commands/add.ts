import path from "node:path";
import { mutateEnvConfig } from "@/features/config-mutation";
import {
	getFrameworkPrefix,
	getPresetKeys,
	getFieldDefinition,
} from "@/features/scaffold/templates/presets";
import type {
	LoggerPort,
	ProjectScannerPort,
	PromptPort,
	WorkspacePort,
} from "@/shared/ports";

export type AddInput = {
	provider?: "vercel" | "netlify";
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
				const selected = await this.prompt.select(
					"Select a hosting provider preset:",
					[
						{ value: "vercel", label: "Vercel", hint: "Add VERCEL, VERCEL_ENV, VERCEL_URL, etc." },
						{ value: "netlify", label: "Netlify", hint: "Add NETLIFY, CONTEXT, URL, DEPLOY_URL, etc." },
					],
					"vercel",
				);
				if (selected === "vercel" || selected === "netlify") {
					provider = selected;
				} else {
					return false;
				}
			}

			const cwd = process.cwd();
			const tsConfigResult = await this.scanner.checkTsConfig(cwd);
			const tsConfig = tsConfigResult.parsed || null;
			const framework = await this.scanner.detectFramework(cwd, tsConfig);

			const envPath = path.resolve(cwd, "env.ts");
			const envExists = await this.workspace.exists(envPath);

			const prefix = getFrameworkPrefix(framework);
			const keys = getPresetKeys(provider, prefix);

			const getManualFieldsText = (validator: "zod" | "valibot" | "arktype"): string => {
				return keys
					.map((key) => `\t${key}: ${getFieldDefinition(key, validator, prefix)},`)
					.join("\n");
			};

			if (!envExists) {
				this.logger.error("Could not locate your env.ts file.");
				this.logger.log("\nPlease add the following environment variables to your schema manually:\n");
				this.logger.log(`{\n${getManualFieldsText("arktype")}\n}`);
				return true;
			}

			const code = await this.workspace.readFile(envPath);

			// Detect validator
			let validator: "zod" | "valibot" | "arktype" = "arktype";
			if (code.includes('from "zod"') || code.includes("from 'zod'")) {
				validator = "zod";
			} else if (code.includes('from "valibot"') || code.includes("from 'valibot'")) {
				validator = "valibot";
			}

			const result = mutateEnvConfig(code, provider, framework, validator);

			if (!result.success || !result.code) {
				this.logger.error(result.error || "Failed to mutate env.ts.");
				this.logger.log("\nPlease add the following environment variables to your schema manually:\n");
				this.logger.log(`{\n${getManualFieldsText(validator)}\n}`);
				return true;
			}

			if (result.updated) {
				await this.workspace.writeFile(envPath, result.code);
				this.logger.success(`Added ${provider === "vercel" ? "Vercel" : "Netlify"} environment variables to env.ts`);
			} else {
				this.logger.info(`All ${provider === "vercel" ? "Vercel" : "Netlify"} environment variables are already present in env.ts`);
			}

			return true;
		} finally {
			this.logger.interactiveStdout(false);
		}
	}
}
