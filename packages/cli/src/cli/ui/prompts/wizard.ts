import { cancel, isCancel } from "@clack/prompts";
import { shake } from "radashi";
import type { ProjectOptions } from "@/features/scaffold";
import type { ParsedTsConfig } from "@/shared/ports";
import { steps } from "./steps";

export async function runPromptWizard(
	defaults?: {
		framework?: ProjectOptions["framework"];
		bunFeatures?: ProjectOptions["bunFeatures"];
		defaultEnvPath?: string;
		tsConfig?: ParsedTsConfig | null;
		envKeys?: string[];
		envKeysSource?: ".env.example" | "project";
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
				framework === "bun-fullstack"
					? (defaults?.bunFeatures ?? ["serve"])
					: undefined,
			language: "ts",
			overwriteEnvSchemaFile: true,
			installTypeDefinitions: framework !== "vanilla",
			installSkill: false,
			envDtsHandling,
			envKeys: detectedKeys ?? undefined,
		});
	}

	const results: any = {};

	const stepsToRun: {
		key: string;
		fn: (ctx: { results: any }) => Promise<any>;
	}[] = [
		{
			key: "overwriteEnvSchemaFile",
			fn: () => steps.overwriteEnvSchemaFile(defaultEnvPath)(),
		},
		{ key: "framework", fn: () => steps.framework(defaults)() },
		{
			key: "bunBuild",
			fn: ({ results }) =>
				results.framework === "bun-fullstack"
					? steps.bunBuild(
							defaults?.bunFeatures?.includes("build") ||
								(results.framework === "bun-fullstack" &&
									defaults?.framework === "bun-fullstack" &&
									defaults?.bunFeatures?.includes("build")),
						)()
					: Promise.resolve(undefined),
		},
		{ key: "useDefaultPath", fn: () => steps.useDefaultPath(defaultEnvPath)() },
		{ key: "path", fn: (ctx) => steps.path(defaultEnvPath)(ctx) },
		{
			key: "installTypeDefinitions",
			fn: (ctx) => steps.installTypeDefinitions(ctx as any),
		},
		{ key: "envDtsHandling", fn: (ctx) => steps.envDtsHandling(ctx as any) },
		{ key: "validator", fn: () => steps.validator() },
		{
			key: "useEnvExample",
			fn: () => steps.useEnvExample(detectedKeys, keysSource)(),
		},
	];

	for (const { key, fn } of stepsToRun) {
		const result = await fn({ results });
		if (result === null || (typeof result === "symbol" && isCancel(result))) {
			cancel("Operation cancelled.");
			return null;
		}
		results[key] = result;
	}

	const bunFeatures: ProjectOptions["bunFeatures"] =
		results.framework === "bun-fullstack"
			? results.bunBuild
				? ["serve", "build"]
				: ["serve"]
			: undefined;

	return shake({
		...results,
		bunFeatures,
		language: "ts",
		installSkill: false, // Defaulting to false, will be overridden by orchestrator if needed
		envKeys: results.useEnvExample ? (detectedKeys ?? undefined) : undefined,
	} as Partial<ProjectOptions>) as ProjectOptions;
}
