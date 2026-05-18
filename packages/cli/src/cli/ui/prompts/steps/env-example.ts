import { existsSync } from "node:fs";
import path from "node:path";
import { confirm, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { code } from "@/cli/ui/visuals";

export const overwriteEnvSchemaFileStep =
	(defaultPath = "./src/env.ts") =>
	async () => {
		if (existsSync(path.resolve(process.cwd(), defaultPath))) {
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
	};

export const useEnvExampleStep =
	(detectedKeys: string[] | null, source = ".env.example") =>
	async () => {
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
	};
