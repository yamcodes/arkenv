import type { ProjectOptions } from "@/features/scaffold";
import type { Template } from "../clients/registry.client";
import type { ParsedTsConfig } from "./project-scanner.port";

/**
 * Port interface for handling interactive CLI prompts.
 */
export type PromptPort = {
	confirm(
		message: string,
		initialValue?: boolean,
		active?: string,
		inactive?: string,
	): Promise<boolean | null>;
	runWizard(
		defaults?: {
			mode?: ProjectOptions["mode"];
			template?: string;
			templates?: Template[];
			name?: string;
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
