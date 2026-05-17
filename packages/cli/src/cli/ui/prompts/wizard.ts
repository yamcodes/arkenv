import { group } from "@clack/prompts";
import { shake } from "radashi";
import type { ProjectOptions } from "@/features/scaffold";
import type { ParsedTsConfig } from "@/shared/ports";
import { steps } from "./steps";
import { isSuccess } from "./utils";

export async function runPromptWizard(
	defaults?: {
		framework?: ProjectOptions["framework"];
		bunFeatures?: ProjectOptions["bunFeatures"];
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
		const framework = defaults?.framework || "vanilla";
		let envDtsHandling: ProjectOptions["envDtsHandling"];

		if (framework === "vite" || framework === "bun-fullstack") {
			envDtsHandling = defaults?.hasTypeFile ? "append" : "overwrite";
		}

		return shake({
			path: defaultEnvPath,
			validator: "arktype",
			framework,
			bunFeatures:
				framework === "bun-fullstack" ? defaults?.bunFeatures : undefined,
			language: "ts",
			overwriteEnvSchemaFile: true,
			installTypeDefinitions: framework !== "vanilla",
			installSkill: false,
			envDtsHandling,
			envKeys: detectedKeys ?? undefined,
		});
	}

	const result = await group(
		{
			overwriteEnvSchemaFile: steps.overwriteEnvSchemaFile(defaultEnvPath),
			framework: steps.framework(defaults),
			bunBuild: ({ results }) =>
				results.framework === "bun-fullstack"
					? steps.bunBuild()
					: Promise.resolve(undefined),
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

	const bunFeatures: ProjectOptions["bunFeatures"] =
		result.framework === "bun-fullstack"
			? result.bunBuild
				? ["serve", "build"]
				: ["serve"]
			: undefined;

	return shake({
		...result,
		bunFeatures,
		language: "ts",
		installSkill: false, // Defaulting to false, will be overridden by orchestrator if needed
		envKeys: result.useEnvExample ? (detectedKeys ?? undefined) : undefined,
	} as Partial<ProjectOptions>) as ProjectOptions;
}
