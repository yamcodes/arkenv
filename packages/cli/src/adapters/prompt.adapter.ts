import { confirm as clackConfirm, isCancel } from "@clack/prompts";
import { shake } from "radashi";
import { runPromptWizard } from "@/cli/ui";
import type { ProjectOptions } from "@/features/scaffold";
import type { Example } from "@/shared/clients";
import type { ParsedTsConfig, PromptPort } from "@/shared/ports";

/**
 * Adapter implementation for the PromptPort using @clack/prompts.
 */
export class ClackPromptAdapter implements PromptPort {
	/**
	 * Prompts the user for a boolean confirmation and returns `null` on cancel.
	 */
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

	/**
	 * Runs the init wizard with prefilled defaults from project detection or flags.
	 */
	async runWizard(
		defaults?: Partial<
			Pick<
				ProjectOptions,
				"mode" | "example" | "name" | "framework" | "bunFeatures"
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
		isYes = false,
	): Promise<ProjectOptions | null> {
		return runPromptWizard(defaults, isYes);
	}
}
