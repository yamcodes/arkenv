import type { ProjectOptions } from "@/features/scaffold";
import type { ParsedTsConfig } from "./project-scanner.port";

/**
 * Port interface for handling interactive CLI prompts.
 */
export type PromptPort = {
	confirm(message: string, initialValue?: boolean): Promise<boolean | null>;
	runWizard(
		defaults?: {
			framework?: ProjectOptions["framework"];
			bunFeatures?: ProjectOptions["bunFeatures"];
			defaultEnvPath?: string;
			tsConfig?: ParsedTsConfig | null;
			envKeys?: string[];
			envKeysSource?: ".env.example" | "project";
			hasTypeFile?: boolean;
		},
		isYes?: boolean,
	): Promise<ProjectOptions | null>;
};
