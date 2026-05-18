import { select } from "@clack/prompts";
import type { ProjectOptions } from "@/features/scaffold";

/**
 * Prompt to ask the user if they want to start with an example template.
 */
export const exampleStep = () => {
	return async () => {
		return select({
			message: "Would you like to start with an example?",
			options: [
				{ value: "none", label: "None (Blank config)", hint: "recommended" },
				{
					value: "vite-zod",
					label: "Vite + Zod",
					hint: "Full-stack validation with Zod",
				},
				{
					value: "basic-valibot",
					label: "Basic + Valibot",
					hint: "Lightweight validation with Valibot",
				},
			],
			initialValue: "none",
		});
	};
};
