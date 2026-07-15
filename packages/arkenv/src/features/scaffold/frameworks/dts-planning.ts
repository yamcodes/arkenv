import type { ScaffoldingPlan } from "@/features/scaffold/plan";

export type PlanDtsFileParams = {
	typeFilePath: string;
	typeFileExists: boolean;
	envDtsHandling?: "overwrite" | "append" | "skip" | undefined;
	/** Content when creating or overwriting the dts file. */
	templateContent: string;
	/** Content used for append actions (typically the schema file path). */
	appendContent: string;
	overwriteLabel: string;
	appendLabel: string;
};

/**
 * Plan overwrite / append / skip actions for a framework env.d.ts file.
 *
 * Shared by Vite (`vite-env.d.ts`) and Bun Fullstack (`bun-env.d.ts`).
 *
 * @param params Dts file path, existence, handling mode, and content.
 * @returns Planned file actions (possibly empty when skipping).
 */
export function planDtsFile(
	params: PlanDtsFileParams,
): ScaffoldingPlan["files"] {
	const {
		typeFilePath,
		typeFileExists,
		envDtsHandling,
		templateContent,
		appendContent,
		overwriteLabel,
		appendLabel,
	} = params;

	if (envDtsHandling === "skip") {
		return [];
	}

	if (envDtsHandling === "append" || (!envDtsHandling && typeFileExists)) {
		return [
			{
				path: typeFilePath,
				content: appendContent,
				action: "append",
				label: appendLabel,
			},
		];
	}

	return [
		{
			path: typeFilePath,
			content: templateContent,
			action: typeFileExists ? "overwrite" : "create",
			label: overwriteLabel,
		},
	];
}
