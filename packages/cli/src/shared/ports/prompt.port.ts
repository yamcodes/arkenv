import type { ProjectOptions } from "@/features/scaffold";

/**
 * Port interface for handling interactive CLI prompts.
 */
export type PromptPort = {
	confirm(message: string, initialValue?: boolean): Promise<boolean | null>;
	runWizard(
		defaults?: {
			framework?: ProjectOptions["framework"];
			defaultEnvPath?: string;
			tsConfig?: any;
			envKeys?: string[] | undefined;
			envKeysSource?: ".env.example" | "project" | undefined;
			hasTypeFile?: boolean;
		},
		isYes?: boolean,
	): Promise<ProjectOptions | null>;
};
