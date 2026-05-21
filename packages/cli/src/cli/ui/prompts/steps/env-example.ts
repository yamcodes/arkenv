import { confirm, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { code } from "@/cli/ui/visuals";

export async function overwriteEnvSchemaFileStep(options: {
	hasEnvSchemaFile: boolean;
	defaultPath?: string | undefined;
}): Promise<boolean | null> {
	const defaultPath = options.defaultPath || "./src/env.ts";
	if (options.hasEnvSchemaFile) {
		const answer = await confirm({
			message: pc.yellow(
				`An existing ArkEnv configuration was found at ${code(defaultPath)}. Do you want to overwrite it?`,
			),
			initialValue: false,
			active: "Yes (override my configuration)",
			inactive: "No (abort)",
		});
		if (isCancel(answer) || !answer) {
			return null;
		}
		return answer;
	}
	return true;
}

export async function useEnvExampleStep(options: {
	detectedKeys: string[] | null;
	keysSource?: ".env.example" | "project" | undefined;
}): Promise<boolean | null> {
	const detectedKeys = options.detectedKeys;
	const source = options.keysSource || ".env.example";
	if (detectedKeys && detectedKeys.length > 0) {
		const count = detectedKeys.length;
		const isSingular = count === 1;
		const message =
			source === ".env.example"
				? `Detected ${code(".env.example")} with ${count} ${isSingular ? "key" : "keys"}. Use ${isSingular ? "it" : "them"} for your schema?`
				: `Detected ${count} environment variable${isSingular ? "" : "s"} used in your project. Use ${isSingular ? "it" : "them"} for your schema?`;

		const answer = await confirm({
			message,
			active: "Yes (Recommended)",
			initialValue: true,
		});
		return isCancel(answer) ? null : (answer as boolean);
	}
	return false;
}
