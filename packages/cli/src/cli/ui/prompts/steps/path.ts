import { confirm, isCancel, text } from "@clack/prompts";
import { code } from "@/cli/ui/visuals";

export const useDefaultPathStep =
	(defaultEnvPath = "./src/env.ts") =>
	async () => {
		const answer = await confirm({
			message: `Use default config path (${code(defaultEnvPath)})?`,
			initialValue: true,
			active: "Yes (Recommended)",
			inactive: "No, let me customize it",
		});
		return isCancel(answer) ? null : (answer as boolean);
	};

export const pathStep =
	(defaultEnvPath = "./src/env.ts") =>
	async ({ results }: { results: { useDefaultPath?: boolean | null } }) => {
		if (results.useDefaultPath === null) return null;
		if (!results.useDefaultPath) {
			const answer = await text({
				message: "Where should we create the ArkEnv config?",
				placeholder: defaultEnvPath,
				initialValue: defaultEnvPath,
			});
			if (isCancel(answer)) return null;
			const trimmed = typeof answer === "string" ? answer.trim() : "";
			return trimmed === "" ? defaultEnvPath : trimmed;
		}
		return defaultEnvPath;
	};
