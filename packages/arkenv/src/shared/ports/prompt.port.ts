import type { ProjectOptions } from "@/features/scaffold";
import type { Example } from "@/shared/clients";
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
				"mode" | "example" | "name" | "framework" | "bunFeatures" | "hostPreset"
			>
		> & {
			examples?: Example[];
			defaultEnvPath?: string;
			tsConfig?: ParsedTsConfig | null;
			envKeys?: string[];
			envKeysSource?: ".env.example" | "project";
			hasTypeFileAtPath?: (options: {
				framework: ProjectOptions["framework"];
				envPath: string;
			}) => boolean | Promise<boolean>;
			hasTypeFile?: boolean;
			hasEnvSchemaFile?: boolean;
			isStrict?: boolean;
			isSimple?: boolean;
		},
		isYes?: boolean,
	): Promise<ProjectOptions | null>;
	/**
	 * Prompt the user to select one option from a list.
	 */
	select<T extends string>(
		message: string,
		options: { value: T; label: string; hint?: string }[],
		initialValue?: T,
	): Promise<T | null>;
};
