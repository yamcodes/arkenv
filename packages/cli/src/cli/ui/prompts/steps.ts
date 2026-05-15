import fs from "node:fs";
import path from "node:path";
import { cancel, confirm, isCancel, select, text } from "@clack/prompts";
import pc from "picocolors";
import { code } from "@/cli/ui";
import type { ProjectOptions } from "@/features/scaffold";

export const steps = {
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

	framework: (defaults?: { framework?: ProjectOptions["framework"] }) =>
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

	useDefaultPath: () =>
		confirm({
			message: "Use default config path (./src/env.ts)?",
			initialValue: true,
			active: "Yes (Recommended)",
			inactive: "No, let me customize it",
		}),

	path: async ({ results }: { results: { useDefaultPath?: boolean } }) => {
		if (!results.useDefaultPath) {
			return text({
				message: "Where should we create the ArkEnv config?",
				placeholder: "./src/env.ts",
				initialValue: "./src/env.ts",
			});
		}
		return "./src/env.ts";
	},

	installTypeDefinitions: async ({
		results,
	}: {
		results: { framework?: string; path?: unknown };
	}) => {
		if (results.framework === "vite" || results.framework === "bun") {
			const typeFile =
				results.framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
			const targetDir = path.dirname(
				path.resolve(process.cwd(), (results.path as string) || "./src/env.ts"),
			);
			const typeFilePath = path.join(targetDir, typeFile);

			if (fs.existsSync(typeFilePath)) {
				return true;
			}

			return confirm({
				message: `Establish ${code(typeFile)} for typesafe environment variables?`,
				initialValue: true,
				active: "Yes (Recommended)",
				inactive: "No",
			});
		}
		return true;
	},

	envDtsHandling: async ({
		results,
	}: {
		results: {
			framework?: string;
			path?: unknown;
			installTypeDefinitions?: boolean;
		};
	}) => {
		if (!results.installTypeDefinitions) return "skip";
		if (results.framework !== "vite" && results.framework !== "bun")
			return "skip";

		const typeFile =
			results.framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
		const targetDir = path.dirname(
			path.resolve(process.cwd(), (results.path as string) || "./src/env.ts"),
		);
		const typeFilePath = path.join(targetDir, typeFile);

		if (fs.existsSync(typeFilePath)) {
			const answer = await select({
				message: `Found existing ${code(typeFile)}. How should we handle ArkEnv types?`,
				options: [
					{
						value: "append",
						label: "Append types safely (if needed)",
						hint: "Recommended",
					},
					{
						value: "overwrite",
						label: "Overwrite entirely",
						hint: "Destructive",
					},
					{ value: "skip", label: "Skip" },
				],
			});
			if (isCancel(answer)) {
				cancel("Operation cancelled.");
				process.exit(0);
			}
			return answer as ProjectOptions["envDtsHandling"];
		}
		return "overwrite";
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

	useEnvExample: async (detectedKeys: string[] | null) => {
		if (detectedKeys) {
			return confirm({
				message: `Detected ${pc.cyan(".env.example")} with ${detectedKeys.length} keys. Use them for your schema?`,
				active: "Yes (Recommended)",
				initialValue: true,
			});
		}
		return false;
	},
};
