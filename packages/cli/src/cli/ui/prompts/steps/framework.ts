import { confirm, isCancel, select } from "@clack/prompts";
import type { ProjectOptions } from "@/features/scaffold";

/**
 * Prompt the user to select their framework or build tool.
 *
 * @param options Default framework option to pre-select
 * @returns The selected framework or null if cancelled
 */
export async function frameworkStep(options: {
	framework?: ProjectOptions["framework"] | undefined;
}): Promise<ProjectOptions["framework"] | null> {
	const answer = await select({
		message: "Select your framework or build tool:",
		initialValue: options.framework,
		options: [
			{
				value: "vanilla",
				label: `Vanilla${options.framework === "vanilla" ? " (Detected)" : ""}`,
				hint: "Node.js, Bun, server-side or runtime-only validation",
			},
			{
				value: "vite",
				label: `Vite${options.framework === "vite" ? " (Detected)" : ""}`,
				hint: "Client-side and static inlining validation",
			},
			{
				value: "bun-fullstack",
				label: `Bun fullstack dev server${options.framework === "bun-fullstack" ? " (Detected)" : ""}`,
				hint: "Client-side bundling and Bun.serve integration",
			},
			{
				value: "nextjs",
				label: `Next.js${options.framework === "nextjs" ? " (Detected)" : ""}`,
				hint: "Next.js App or Pages Router with build and runtime validation",
			},
		],
	});
	return isCancel(answer) ? null : (answer as ProjectOptions["framework"]);
}

/**
 * Prompt the user to bootstrap a custom Bun.build script.
 *
 * @param options Options including default/initial value for the prompt
 * @returns Whether the user confirmed or null if cancelled
 */
export async function bunBuildStep(options: {
	initialValue?: boolean | undefined;
}): Promise<boolean | null> {
	const answer = await confirm({
		message:
			"Optional: Would you also like to bootstrap a custom Bun.build script for programmatic bundling?",
		initialValue: options.initialValue ?? false,
	});
	return isCancel(answer) ? null : answer;
}

/**
 * Prompt the user to select their preferred validator library.
 *
 * @param options Optional wizard framework context to automatically skip prompting if Next.js is selected
 * @returns The selected validator or null if cancelled
 */
export async function validatorStep(options?: {
	framework?: ProjectOptions["framework"] | undefined;
}): Promise<ProjectOptions["validator"] | null> {
	if (options?.framework === "nextjs") {
		return "arktype";
	}
	const answer = await select({
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
	});
	return isCancel(answer) ? null : (answer as ProjectOptions["validator"]);
}
