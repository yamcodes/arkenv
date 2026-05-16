import fs from "node:fs";
import path from "node:path";
import { group, isCancel } from "@clack/prompts";
import { getEnvExampleKeys, type ProjectOptions } from "@/features/scaffold";
import { steps } from "./steps";

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

		return {
			path: "./src/env.ts",
			validator: "arktype",
			framework,
			language: "ts",
			overwriteEnvSchemaFile: true,
			envDtsHandling,
			installTypeDefinitions: framework !== "node",
			envKeys: detectedKeys || undefined,
			installSkill: false,
		};
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

	if (isCancel(result) || Object.values(result).some((v) => v === null)) {
		return null;
	}

	return {
		path: (result.path as string) || "./src/env.ts",
		validator: result.validator as ProjectOptions["validator"],
		framework: result.framework as ProjectOptions["framework"],
		language: "ts",
		overwriteEnvSchemaFile: result.overwriteEnvSchemaFile as boolean,
		envDtsHandling: result.envDtsHandling as ProjectOptions["envDtsHandling"],
		installTypeDefinitions: result.installTypeDefinitions as boolean,
		envKeys: result.useEnvExample ? (detectedKeys as string[]) : undefined,
		installSkill: false, // Defaulting to false, will be overridden by orchestrator if needed
	};
}
