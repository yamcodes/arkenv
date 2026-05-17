import { isCancel, multiselect, select } from "@clack/prompts";
import type { ProjectOptions } from "@/features/scaffold";

export const frameworkStep =
	(defaults?: { framework?: ProjectOptions["framework"] }) => async () => {
		const answer = await select({
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
		});
		return isCancel(answer) ? null : (answer as ProjectOptions["framework"]);
	};

export const bunFeaturesStep =
	(defaults?: { bunFeatures?: ProjectOptions["bunFeatures"] }) => async () => {
		const answer = await multiselect({
			message: "Which Bun-specific APIs would you like to integrate?",
			options: [
				{
					value: "serve",
					label: "Bun.serve (Fullstack dev server)",
					hint: "Add plugin to bunfig.toml",
				},
				{
					value: "build",
					label: "Bun.build (Programmatic Bundler)",
					hint: "Provide snippet for your build script",
				},
			],
			initialValues: defaults?.bunFeatures ?? [],
			required: false,
		});
		return isCancel(answer) ? null : (answer as ProjectOptions["bunFeatures"]);
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
