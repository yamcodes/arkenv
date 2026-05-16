import fs from "node:fs";
import path from "node:path";
import { confirm, isCancel, select } from "@clack/prompts";
import { code } from "@/cli/ui/visuals";
import type { ProjectOptions } from "@/features/scaffold";

export const installTypeDefinitionsStep = async ({
	results,
}: {
	results: { framework?: string | null; path?: unknown };
}) => {
	if (results.framework === null) return null;
	if (results.framework === "vite" || results.framework === "bun") {
		const typeFile =
			results.framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
		const targetDir = path.dirname(
			path.resolve(process.cwd(), (results.path as string) || "./src/env.ts"),
		);
		const typeFilePath = path.join(targetDir, typeFile);

		if (fs.existsSync(typeFilePath)) {
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
};

export const envDtsHandlingStep = async ({
	results,
}: {
	results: {
		framework?: string | null;
		path?: unknown;
		installTypeDefinitions?: boolean | null;
	};
}) => {
	if (results.installTypeDefinitions === null) return null;
	if (!results.installTypeDefinitions) return "skip";
	if (results.framework !== "vite" && results.framework !== "bun")
		return "skip";

	const typeFile =
		results.framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
	const targetDir = path.dirname(
		path.resolve(process.cwd(), (results.path as string) || "./src/env.ts"),
	);
	const typeFilePath = path.join(targetDir, typeFile);

	if (fs.existsSync(typeFilePath)) {
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
};
