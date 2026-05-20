import type { ProjectOptions } from "@/features/scaffold";
import type { Template } from "@/shared/clients/registry.client";
import type { ParsedTsConfig } from "./project-scanner.port";

/**
 * Port interface for handling interactive CLI prompts.
 */
export type PromptPort = {
	/**
	 * Prompts for a boolean confirmation and returns `null` when the prompt is cancelled.
	 */
	confirm(
		message: string,
		initialValue?: boolean,
		active?: string,
		inactive?: string,
	): Promise<boolean | null>;
	/**
	 * Collects init options through the interactive wizard.
	 */
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
