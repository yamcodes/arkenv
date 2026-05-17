import { confirm as clackConfirm, isCancel } from "@clack/prompts";
import { runPromptWizard } from "@/cli/ui";
import type { ProjectOptions } from "@/features/scaffold";
import type { ParsedTsConfig, PromptPort } from "@/shared/ports";

/**
 * Adapter implementation for the PromptPort using @clack/prompts.
 */
export class ClackPromptAdapter implements PromptPort {
	async confirm(message: string, initialValue = true): Promise<boolean | null> {
		const result = await clackConfirm({
			message,
			initialValue,
		});
		if (isCancel(result)) return null;
		return result;
	}

	async runWizard(
		defaults?: {
			framework?: ProjectOptions["framework"];
			bunFeatures?: ProjectOptions["bunFeatures"];
			defaultEnvPath?: string;
			tsConfig?: ParsedTsConfig | null;
			envKeys?: string[] | undefined;
			envKeysSource?: ".env.example" | "project" | undefined;
			hasTypeFile?: boolean;
		},
		isYes = false,
	): Promise<ProjectOptions | null> {
		return runPromptWizard(defaults, isYes);
	}
}
