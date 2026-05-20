import { confirm as clackConfirm, isCancel } from "@clack/prompts";
import { shake } from "radashi";
import { runPromptWizard } from "@/cli/ui";
import type { ProjectOptions } from "@/features/scaffold";
import type { Template } from "@/shared/clients/registry.client";
import type { ParsedTsConfig, PromptPort } from "@/shared/ports";

/**
 * Adapter implementation for the PromptPort using @clack/prompts.
 */
export class ClackPromptAdapter implements PromptPort {
	async confirm(
		message: string,
		initialValue = true,
		active?: string,
		inactive?: string,
	): Promise<boolean | null> {
		const result = await clackConfirm(
			shake({
				message,
				initialValue,
				active,
				inactive,
			}),
		);
		if (isCancel(result)) return null;
		return result;
	}

	async runWizard(
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
		isYes = false,
	): Promise<ProjectOptions | null> {
		return runPromptWizard(defaults, isYes);
	}
}
