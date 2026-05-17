import { group } from "@clack/prompts";
import { shake } from "radashi";
import type { ProjectOptions } from "@/features/scaffold";
import type { ParsedTsConfig } from "@/shared/ports";
import { steps } from "./steps";
import { isSuccess } from "./utils";

export async function runPromptWizard(
	defaults?: {
		framework?: ProjectOptions["framework"];
		defaultEnvPath?: string;
		tsConfig?: ParsedTsConfig | null;
		envKeys?: string[] | undefined;
		envKeysSource?: ".env.example" | "project" | undefined;
		hasTypeFile?: boolean;
	},
	isYes = false,
): Promise<ProjectOptions | null> {
	const defaultEnvPath = defaults?.defaultEnvPath || "./src/env.ts";
	const detectedKeys = defaults?.envKeys || null;
	const keysSource = defaults?.envKeysSource || ".env.example";

	if (isYes) {
		const framework = defaults?.framework || "node";
		let envDtsHandling: ProjectOptions["envDtsHandling"];

		if (framework === "vite" || framework === "bun") {
			envDtsHandling = defaults?.hasTypeFile ? "append" : "overwrite";
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

	const result = await group({
		overwriteEnvSchemaFile: steps.overwriteEnvSchemaFile(defaultEnvPath),
		framework: steps.framework(defaults),
		useDefaultPath: steps.useDefaultPath(defaultEnvPath),
		path: steps.path(defaultEnvPath),
		installTypeDefinitions: steps.installTypeDefinitions,
		envDtsHandling: steps.envDtsHandling,
		validator: steps.validator,
		useEnvExample: steps.useEnvExample(detectedKeys, keysSource),
	});

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
