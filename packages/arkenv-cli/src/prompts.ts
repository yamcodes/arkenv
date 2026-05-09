import { cancel, confirm, group, isCancel, select, text } from "@clack/prompts";

export type ProjectOptions = {
	path: string;
	validator: "arktype" | "zod" | "valibot";
	framework: "vite" | "bun" | "node";
	language: "ts"; // TODO: Support JS
};

export async function runPromptWizard(
	defaults?: {
		framework?: "vite" | "bun" | "node";
	},
	isYes = false,
): Promise<ProjectOptions | null> {
	if (isYes) {
		return {
			path: "./src/env.ts",
			validator: "arktype",
			framework: defaults?.framework || "node",
			language: "ts",
		} as ProjectOptions;
	}

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
				return null;
			},
		},
	);

	if (isCancel(result)) return null;

	return {
		path: result.path || "./src/env.ts",
		validator: result.validator,
		framework: result.framework,
		language: "ts",
	};
}
