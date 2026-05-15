import type { ProjectOptions } from "../../features/scaffold/plan";

export type PromptPort = {
	confirm(message: string, initialValue?: boolean): Promise<boolean>;
	runWizard(
		defaults?: {
			framework?: ProjectOptions["framework"];
		},
		isYes?: boolean,
	): Promise<ProjectOptions | null>;
};
