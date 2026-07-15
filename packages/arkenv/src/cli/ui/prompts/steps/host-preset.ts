import { isCancel, select } from "@clack/prompts";
import type { ProjectOptions } from "@/features/scaffold";
import { PRESETS } from "@/features/scaffold/presets";

/**
 * Prompt for an optional hosting provider preset.
 *
 * @param options Optional initial selection
 * @returns Selected host preset, or `null` when cancelled
 */
export async function hostPresetStep(options?: {
	initialValue?: ProjectOptions["hostPreset"] | undefined;
}): Promise<ProjectOptions["hostPreset"] | null> {
	const selectOptions = [
		{
			value: "none" as const,
			label: "None",
			hint: "Do not add any hosting-specific environment variables",
		},
		...Object.entries(PRESETS).map(([value, def]) => ({
			value,
			label: def.label,
			hint: def.hint,
		})),
	];

	const answer = await select({
		message: "Select a hosting provider preset (optional):",
		initialValue: options?.initialValue ?? "none",
		options: selectOptions,
	});
	return isCancel(answer) ? null : (answer as ProjectOptions["hostPreset"]);
}
