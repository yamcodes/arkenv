import fs from "node:fs";
import path from "node:path";
import { confirm, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { code } from "@/cli/ui/visuals";

export const overwriteEnvSchemaFileStep =
	(defaultPath = "./src/env.ts") =>
	async () => {
		if (fs.existsSync(path.resolve(process.cwd(), defaultPath))) {
			const answer = await confirm({
				message:
					pc.yellow(
						`An existing ArkEnv configuration was found at ${code(defaultPath)}. Do you want to overwrite it?`,
					) + ` ${pc.dim("(Arrows to navigate, Enter to select)")}`,
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
			const message =
				(source === ".env.example"
					? `Detected ${code(".env.example")} with ${detectedKeys.length} keys. Use them for your schema?`
					: `Detected ${detectedKeys.length} environment variables used in your project. Use them for your schema?`) +
				` ${pc.dim("(Arrows to navigate, Enter to select)")}`;

			const answer = await confirm({
				message,
				active: "Yes (Recommended)",
				initialValue: true,
			});
			return isCancel(answer) ? null : (answer as boolean);
		}
		return false;
	};
