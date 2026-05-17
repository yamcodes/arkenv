import { isCancel, select } from "@clack/prompts";
import pc from "picocolors";
import type { ProjectOptions } from "@/features/scaffold";

export const frameworkStep =
	(defaults?: { framework?: ProjectOptions["framework"] }) => async () => {
		const answer = await select({
			message: `Select your framework or runtime:`,
			hint: pc.dim("(Arrows to navigate, Enter to select)"),
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

export const validatorStep = async () => {
	const answer = await select({
		message: `Select your preferred validator library:`,
		hint: pc.dim("(Arrows to navigate, Enter to select)"),
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
