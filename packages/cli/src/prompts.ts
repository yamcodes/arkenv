import fs from "node:fs";
import path from "node:path";
import { cancel, confirm, group, isCancel, select, text } from "@clack/prompts";
import pc from "picocolors";
import { code } from "./visuals.ts";

export type ProjectOptions = {
	path: string;
	validator: "arktype" | "zod" | "valibot";
	framework: "vite" | "bun" | "node";
	language: "ts"; // TODO: Support JS
	overwrite?: boolean;
};

export async function runPromptWizard(
	defaults?: {
		framework?: ProjectOptions["framework"];
	},
	isYes = false,
): Promise<ProjectOptions | null> {
	if (isYes) {
		return {
			path: "./src/env.ts",
			validator: "arktype",
			framework: defaults?.framework || "node",
			language: "ts",
			overwrite: true,
		} as ProjectOptions;
	}

	const result = await group(
		{
			overwrite: async () => {
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
							hint: "Browser-based projects",
						},
						{
							value: "bun",
							label: `Bun${defaults?.framework === "bun" ? " (Detected)" : ""}`,
							hint: "Fast JS runtime",
						},
						{
							value: "node",
							label: `Node.js${defaults?.framework === "node" ? " (Detected)" : ""}`,
							hint: "Standard backend",
						},
					],
				}),
			validator: () =>
				select({
					message: "Select your preferred validator library:",
					options: [
						{
							value: "arktype",
							label: "ArkType (Recommended)",
							hint: "Fastest runtime validation",
						},
						{ value: "zod", label: "Zod", hint: "Most popular" },
						{
							value: "valibot",
							label: "Valibot",
							hint: "Smallest bundle size",
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
			path: ({ results }) => {
				if (!results.useDefaultPath) {
					return text({
						message: "Where should we create the ArkEnv config?",
						placeholder: "./src/env.ts",
						initialValue: "./src/env.ts",
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
		overwrite: result.overwrite as boolean,
	};
}
