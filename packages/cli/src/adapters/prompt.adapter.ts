import { confirm as clackConfirm, isCancel } from "@clack/prompts";
import { runPromptWizard } from "@/cli/ui/prompts";
import type { ProjectOptions } from "@/features/scaffold/plan";
import type { PromptPort } from "@/shared/ports/prompt.port";

export class ClackPromptAdapter implements PromptPort {
	async confirm(message: string, initialValue = true): Promise<boolean> {
		const result = await clackConfirm({
			message,
			initialValue,
		});
		if (isCancel(result)) return false;
		return result;
	}

	async runWizard(
		defaults?: { framework?: ProjectOptions["framework"] },
		isYes = false,
	): Promise<ProjectOptions | null> {
		return runPromptWizard(defaults, isYes);
	}
}
