import { confirm, isCancel, select } from "@clack/prompts";
import { code } from "@/cli/ui/visuals";
import type { Framework, ProjectOptions } from "@/features/scaffold";

/**
 * Determines whether the wizard should create framework environment types.
 */
export async function installTypeDefinitionsStep(options: {
	framework: Framework;
	hasTypeFile: boolean;
}): Promise<boolean | null> {
	if (options.framework === "vite" || options.framework === "bun-fullstack") {
		const typeFile =
			options.framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";

		if (options.hasTypeFile) {
			return true;
		}

		const answer = await confirm({
			message: `Establish ${code(typeFile)} for typesafe environment variables?`,
			initialValue: true,
			active: "Yes (Recommended)",
			inactive: "No",
		});
		return isCancel(answer) ? null : (answer as boolean);
	}
	return true;
}

/**
 * Chooses how to handle an existing framework type definition file.
 */
export async function envDtsHandlingStep(options: {
	framework: Framework;
	installTypeDefinitions: boolean;
	hasTypeFile: boolean;
}): Promise<ProjectOptions["envDtsHandling"] | null> {
	if (!options.installTypeDefinitions) return "skip";
	if (options.framework !== "vite" && options.framework !== "bun-fullstack") {
		return "skip";
	}

	const typeFile =
		options.framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";

	if (options.hasTypeFile) {
		const answer = await select({
			message: `Found existing ${code(typeFile)}. How should we handle ArkEnv types?`,
			options: [
				{
					value: "append",
					label: "Append types safely (if needed)",
					hint: "Recommended",
				},
				{
					value: "overwrite",
					label: "Overwrite entirely",
					hint: "Destructive",
				},
				{ value: "skip", label: "Skip" },
			],
		});
		if (isCancel(answer)) {
			return null;
		}
		return answer as ProjectOptions["envDtsHandling"];
	}
	return "overwrite";
}
