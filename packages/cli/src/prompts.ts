import fs from "node:fs";
import path from "node:path";
import { cancel, confirm, group, isCancel, select, text } from "@clack/prompts";
import pc from "picocolors";
import { getEnvExampleKeys } from "./env-parser.ts";
import { code } from "./visuals.ts";

export type ProjectOptions = {
	path: string;
	validator: "arktype" | "zod" | "valibot";
	framework: "vite" | "bun" | "node";
	language: "ts"; // TODO: Support JS
	overwriteEnvSchemaFile?: boolean | undefined;
	overwriteEnvDtsFile?: boolean | undefined;
	installTypeDefinitions?: boolean | undefined;
	envKeys?: string[] | undefined;
	installSkill?: boolean | undefined;
};

export async function runPromptWizard(
	defaults?: {
		framework?: ProjectOptions["framework"];
	},
	isYes = false,
	isAgent = false,
): Promise<ProjectOptions | null> {
	const detectedKeys = await getEnvExampleKeys();

	if (isYes) {
		return {
			path: "./src/env.ts",
			validator: "arktype",
			framework: defaults?.framework || "node",
			language: "ts",
			overwriteEnvSchemaFile: true,
			overwriteEnvDtsFile: true,
			installTypeDefinitions: true,
			envKeys: detectedKeys || undefined,
			installSkill: false,
		} as ProjectOptions;
	}

	const result = await group(
		{
			overwriteEnvSchemaFile: async () => {
				const defaultPath = "./src/env.ts";
				if (fs.existsSync(path.resolve(process.cwd(), defaultPath))) {
					const answer = await confirm({
						message: pc.yellow(
							`An existing ArkEnv configuration was found at ${code(defaultPath)}. Do you want to overwrite it?`,
						),
						initialValue: false,
						active: "Yes (override my configuration)",
						inactive: "No (abort)",
					});
					if (isCancel(answer)) {
						cancel("Operation cancelled.");
						process.exit(0);
					}
					if (!answer) {
						cancel("Operation cancelled.");
						process.exit(0);
					}
					return answer;
				}
				return true;
			},
			framework: () =>
				select({
					message: "Select your framework or runtime:",
					initialValue: defaults?.framework,
					options: [
						{
							value: "vite",
							label: `Vite${defaults?.framework === "vite" ? " (Detected)" : ""}`,
						},
						{
							value: "bun",
							label: `Bun${defaults?.framework === "bun" ? " (Detected)" : ""}`,
						},
						{
							value: "node",
							label: `Node.js${defaults?.framework === "node" ? " (Detected)" : ""}`,
						},
					],
				}),
			installTypeDefinitions: async ({ results }) => {
				if (results.framework === "vite" || results.framework === "bun") {
					const typeFile =
						results.framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
					return confirm({
						message: `Establish ${code(typeFile)} for typesafe environment variables?`,
						initialValue: true,
						active: "Yes (Recommended)",
						inactive: "No",
					});
				}
				return true;
			},
			overwriteEnvDtsFile: async ({ results }) => {
				if (!results.installTypeDefinitions) return false;
				if (results.framework !== "vite" && results.framework !== "bun")
					return false;

				const typeFile =
					results.framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
				// Use the same directory as the environment config
				const targetDir = path.dirname(path.resolve(process.cwd(), "./src/env.ts"));
				const typeFilePath = path.join(targetDir, typeFile);

				if (fs.existsSync(typeFilePath)) {
					const answer = await confirm({
						message: pc.yellow(
							`Type definition file ${code(typeFile)} already exists. Overwrite?`,
						),
						initialValue: true,
						active: "Yes (Recommended)",
						inactive: "No",
					});
					if (isCancel(answer)) {
						cancel("Operation cancelled.");
						process.exit(0);
					}
					return answer;
				}
				return true;
			},
			validator: () =>
				select({
					message: "Select your preferred validator library:",
					options: [
						{
							value: "arktype",
							label: "ArkType (Recommended)",
							hint: "TypeScript's 1:1 validator, optimized from editor to runtime",
						},
						{
							value: "zod",
							label: "Zod",
							hint: "TypeScript-first schema validation with static type inference",
						},
						{
							value: "valibot",
							label: "Valibot",
							hint: "The modular and type safe schema library",
						},
					],
				}),
			useEnvExample: async () => {
				if (detectedKeys) {
					return confirm({
						message: `Detected ${pc.cyan(".env.example")} with ${detectedKeys.length} keys. Use them for your schema?`,
						active: "Yes (Recommended)",
						initialValue: true,
					});
				}
				return false;
			},
			useDefaultPath: () =>
				confirm({
					message: "Use default config path (./src/env.ts)?",
					initialValue: true,
					active: "Yes (Recommended)",
					inactive: "No, let me customize it",
				}),
			path: ({ results }) => {
				if (!results.useDefaultPath) {
					return text({
						message: "Where should we create the ArkEnv config?",
						placeholder: "./src/env.ts",
						initialValue: "./src/env.ts",
					});
				}
			},
			installSkill: () => {
				if (!isAgent) {
					return confirm({
						message: "Would you like to install the ArkEnv agent skill?",
						initialValue: true,
						active: "Yes (Recommended)",
						inactive: "No",
					});
				}
			},
		},
		{
			onCancel: () => {
				cancel("Operation cancelled.");
				process.exit(0);
			},
		},
	);

	if (isCancel(result)) {
		cancel("Operation cancelled.");
		process.exit(0);
	}

	return {
		path: (result.path as string) || "./src/env.ts",
		validator: result.validator as ProjectOptions["validator"],
		framework: result.framework as ProjectOptions["framework"],
		language: "ts",
		overwriteEnvSchemaFile: result.overwriteEnvSchemaFile as boolean,
		overwriteEnvDtsFile: result.overwriteEnvDtsFile as boolean,
		installTypeDefinitions: result.installTypeDefinitions as boolean,
		envKeys: result.useEnvExample ? (detectedKeys as string[]) : undefined,
		installSkill: result.installSkill as boolean,
	};
}
