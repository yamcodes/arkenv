import { group, select, text, isCancel, cancel } from "@clack/prompts";

export type ProjectOptions = {
	path: string;
	validator: "arktype" | "zod" | "valibot";
	framework: "vite" | "bun" | "node";
	language: "ts"; // Initially focusing on TS
};

export async function runPromptWizard(): Promise<ProjectOptions | null> {
	const result = await group(
		{
			path: () =>
				text({
					message: "Where should we create the ArkEnv config?",
					placeholder: "./src/env.ts",
					initialValue: "./src/env.ts",
				}),
			validator: () =>
				select({
					message: "Select your preferred validator library:",
					options: [
						{ value: "arktype", label: "ArkType (Recommended)", hint: "Fastest runtime validation" },
						{ value: "zod", label: "Zod", hint: "Most popular" },
						{ value: "valibot", label: "Valibot", hint: "Smallest bundle size" },
					],
				}),
			framework: () =>
				select({
					message: "Select your target runtime or framework:",
					options: [
						{ value: "vite", label: "Vite", hint: "Browser-based projects" },
						{ value: "bun", label: "Bun", hint: "Fast JS runtime" },
						{ value: "node", label: "Node.js", hint: "Standard backend" },
					],
				}),
		},
		{
			onCancel: () => {
				cancel("Operation cancelled.");
				process.exit(0);
			},
		},
	);

	if (isCancel(result)) return null;

	return {
		...result,
		language: "ts",
	} as ProjectOptions;
}
