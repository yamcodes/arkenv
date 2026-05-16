import fs from "node:fs";
import path from "node:path";
import { group } from "@clack/prompts";
import { shake } from "radashi";
import { getEnvExampleKeys, type ProjectOptions } from "@/features/scaffold";
import { steps } from "./steps";
import { isSuccess } from "./utils";

export async function runPromptWizard(
	defaults?: {
		framework?: ProjectOptions["framework"];
		defaultEnvPath?: string;
		tsConfig?: any;
	},
	isYes = false,
): Promise<ProjectOptions | null> {
	const defaultEnvPath = defaults?.defaultEnvPath || "./src/env.ts";
	const envRes = await getEnvExampleKeys(
		process.cwd(),
		defaults?.tsConfig,
		path.resolve(process.cwd(), defaultEnvPath),
	);
	const detectedKeys = envRes?.keys || null;
	const keysSource = envRes?.source || ".env.example";

	if (isYes) {
		const framework = defaults?.framework || "node";
		let envDtsHandling: ProjectOptions["envDtsHandling"];

		if (framework === "vite" || framework === "bun") {
			const typeFile = framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
			const targetDir = path.dirname(
				path.resolve(process.cwd(), defaultEnvPath),
			);
			const typeFilePath = path.join(targetDir, typeFile);
			envDtsHandling = fs.existsSync(typeFilePath) ? "append" : "overwrite";
		}

		return shake({
			path: defaultEnvPath,
			validator: "arktype",
			framework,
			language: "ts",
			overwriteEnvSchemaFile: true,
			installTypeDefinitions: framework !== "node",
			installSkill: false,
			envDtsHandling,
			envKeys: detectedKeys ?? undefined,
		});
	}

	const result = await group(
		{
			overwriteEnvSchemaFile: steps.overwriteEnvSchemaFile(defaultEnvPath),
			framework: steps.framework(defaults),
			useDefaultPath: steps.useDefaultPath(defaultEnvPath),
			path: steps.path(defaultEnvPath),
			installTypeDefinitions: steps.installTypeDefinitions,
			envDtsHandling: steps.envDtsHandling,
			validator: steps.validator,
			useEnvExample: steps.useEnvExample(detectedKeys, keysSource),
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

	return shake({
		...result,
		language: "ts",
		installSkill: false, // Defaulting to false, will be overridden by orchestrator if needed
		envKeys: result.useEnvExample ? (detectedKeys ?? undefined) : undefined,
	} as Partial<ProjectOptions>) as ProjectOptions;
}
