import { confirm, isCancel, text } from "@clack/prompts";
import { code } from "@/cli/ui/visuals";

export async function useDefaultPathStep(options: {
	defaultEnvPath?: string | undefined;
}): Promise<boolean | null> {
	const defaultEnvPath = options.defaultEnvPath || "./src/env.ts";
	const answer = await confirm({
		message: `Use default config path (${code(defaultEnvPath)})?`,
		initialValue: true,
		active: "Yes (Recommended)",
		inactive: "No, let me customize it",
	});
	return isCancel(answer) ? null : (answer as boolean);
}

export async function pathStep(options: {
	useDefaultPath: boolean;
	defaultEnvPath?: string | undefined;
}): Promise<string | null> {
	const defaultEnvPath = options.defaultEnvPath || "./src/env.ts";
	if (!options.useDefaultPath) {
		const answer = await text({
			message: "Where should we create the ArkEnv config?",
			placeholder: defaultEnvPath,
			initialValue: defaultEnvPath,
			defaultValue: defaultEnvPath,
		});
		if (isCancel(answer)) return null;
		const trimmed = typeof answer === "string" ? answer.trim() : "";
		return trimmed === "" ? defaultEnvPath : trimmed;
	}
	return defaultEnvPath;
}
