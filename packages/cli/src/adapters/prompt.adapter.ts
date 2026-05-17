import { confirm as clackConfirm, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { runPromptWizard } from "@/cli/ui";
import type { ProjectOptions } from "@/features/scaffold";
import type { ParsedTsConfig, PromptPort } from "@/shared/ports";

/**
 * Adapter implementation for the PromptPort using @clack/prompts.
 */
export class ClackPromptAdapter implements PromptPort {
	async confirm(message: string, initialValue = true): Promise<boolean | null> {
		const result = await clackConfirm({
			message: `${message} ${pc.dim("(Arrows to navigate, Enter to select)")}`,
			initialValue,
		});
		if (isCancel(result)) return null;
		return result;
	}

	async runWizard(
		defaults?: {
			framework?: ProjectOptions["framework"];
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
