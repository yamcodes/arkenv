import fs from "node:fs";
import path from "node:path";
import { group } from "@clack/prompts";
import { getEnvExampleKeys, type ProjectOptions } from "@/features/scaffold";
import { steps } from "./steps";
import { isSuccess } from "./utils";

export async function runPromptWizard(
	defaults?: {
		framework?: ProjectOptions["framework"];
	},
	isYes = false,
): Promise<ProjectOptions | null> {
	const detectedKeys = await getEnvExampleKeys();

	if (isYes) {
		const framework = defaults?.framework || "node";
		let envDtsHandling: ProjectOptions["envDtsHandling"];

		if (framework === "vite" || framework === "bun") {
			const typeFile = framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
			const targetDir = path.dirname(
				path.resolve(process.cwd(), "./src/env.ts"),
			);
			const typeFilePath = path.join(targetDir, typeFile);
			envDtsHandling = fs.existsSync(typeFilePath) ? "append" : "overwrite";
		}

		const options: ProjectOptions = {
			path: "./src/env.ts",
			validator: "arktype",
			framework,
			language: "ts",
			overwriteEnvSchemaFile: true,
			installTypeDefinitions: framework !== "node",
			installSkill: false,
		};
		if (envDtsHandling) options.envDtsHandling = envDtsHandling;
		if (detectedKeys) options.envKeys = detectedKeys;
		return options;
	}

	const result = await group(
		{
			overwriteEnvSchemaFile: steps.overwriteEnvSchemaFile,
			framework: () => steps.framework(defaults),
			useDefaultPath: steps.useDefaultPath,
			path: steps.path,
			installTypeDefinitions: steps.installTypeDefinitions,
			envDtsHandling: steps.envDtsHandling,
			validator: steps.validator,
			useEnvExample: () => steps.useEnvExample(detectedKeys),
		},
		{
			onCancel: () => {
				// We don't exit here, we let the group return a canceled state or null
			},
		},
	);

	if (!isSuccess(result)) {
		return null;
	}

	const options: ProjectOptions = {
		...result,
		language: "ts",
		installSkill: false, // Defaulting to false, will be overridden by orchestrator if needed
	};

	if (result.useEnvExample && detectedKeys) {
		options.envKeys = detectedKeys;
	}

	return options;
}
