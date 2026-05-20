import type { ProjectOptions } from "@/features/scaffold";
import type { Template } from "@/shared/clients";
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
		defaults?: Partial<
			Pick<
				ProjectOptions,
				"mode" | "template" | "name" | "framework" | "bunFeatures"
			>
		> & {
			templates?: Template[];
			defaultEnvPath?: string;
			tsConfig?: ParsedTsConfig | null;
			envKeys?: string[];
			envKeysSource?: ".env.example" | "project";
			hasTypeFile?: boolean;
		},
		isYes?: boolean,
	): Promise<ProjectOptions | null>;
};
