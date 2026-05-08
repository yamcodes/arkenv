import { cancel, group, isCancel, select, text } from "@clack/prompts";

export type ProjectOptions = {
	path: string;
	validator: "arktype" | "zod" | "valibot";
	framework: "vite" | "bun" | "node";
	language: "ts"; // Initially focusing on TS
};

export async function runPromptWizard(defaults?: {
	framework?: "vite" | "bun" | "node";
}): Promise<ProjectOptions | null> {
	const result = await group(
		{
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
			path: () =>
				text({
					message:
						"Where should we create the ArkEnv config? (Recommended: ./src/env.ts)",
					placeholder: "./src/env.ts",
					initialValue: "./src/env.ts",
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
