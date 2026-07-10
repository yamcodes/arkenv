import { isCancel, select } from "@clack/prompts";
import type { ProjectOptions } from "@/features/scaffold";

export async function hostPresetStep(options?: {
	initialValue?: ProjectOptions["hostPreset"] | undefined;
}): Promise<ProjectOptions["hostPreset"] | null> {
	const answer = await select({
		message: "Select a hosting provider preset (optional):",
		initialValue: options?.initialValue ?? "none",
		options: [
			{
				value: "none",
				label: "None",
				hint: "Do not add any hosting-specific environment variables",
			},
			{
				value: "vercel",
				label: "Vercel",
				hint: "Add VERCEL, VERCEL_ENV, VERCEL_URL, etc.",
			},
			{
				value: "netlify",
				label: "Netlify",
				hint: "Add NETLIFY, CONTEXT, URL, DEPLOY_URL, etc.",
			},
		],
	});
	return isCancel(answer) ? null : (answer as ProjectOptions["hostPreset"]);
}
