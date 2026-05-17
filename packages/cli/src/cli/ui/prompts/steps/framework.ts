import { confirm, isCancel, select } from "@clack/prompts";
import type { ProjectOptions } from "@/features/scaffold";

export const frameworkStep =
	(defaults?: { framework?: ProjectOptions["framework"] }) => async () => {
		const answer = await select({
			message: "Select your framework or build tool:",
			initialValue: defaults?.framework,
			options: [
				{
					value: "vanilla",
					label: `Vanilla${defaults?.framework === "vanilla" ? " (Detected)" : ""}`,
					hint: "Node.js, Bun, server-side or runtime-only validation",
				},
				{
					value: "vite",
					label: `Vite${defaults?.framework === "vite" ? " (Detected)" : ""}`,
					hint: "Client-side and build-time validation",
				},
				{
					value: "bun-fullstack",
					label: `Bun fullstack dev server${defaults?.framework === "bun-fullstack" ? " (Detected)" : ""}`,
					hint: "Client-side bundling and Bun.serve integration",
				},
			],
		});
		return isCancel(answer) ? null : (answer as ProjectOptions["framework"]);
	};

export const bunBuildStep = async () => {
	const answer = await confirm({
		message:
			"Optional: Would you also like to bootstrap a custom Bun.build script for programmatic bundling?",
		initialValue: false,
	});
	return isCancel(answer) ? null : answer;
};

export const validatorStep = async () => {
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
};
