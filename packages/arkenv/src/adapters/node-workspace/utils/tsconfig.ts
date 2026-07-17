import path from "node:path";
import { applyEdits, modify, parse } from "jsonc-parser";
import { findTsConfig } from "@/adapters/node-project-scanner/utils/tsconfig";

export async function updateTsConfigToStrict(
	workspace: {
		readFile(path: string): Promise<string>;
		writeFile(path: string, content: string): Promise<void>;
	},
	filePath?: string,
) {
	const tsConfigPath = filePath || (await findTsConfig());
	if (!tsConfigPath) return { status: "not_found" as const };
	const fileName = path.basename(tsConfigPath);

	try {
		const content = await workspace.readFile(tsConfigPath);
		const parsed = parse(content);

		if (parsed?.compilerOptions?.strict === true) {
			return { status: "already_strict" as const, file: fileName };
		}

		const edits = modify(content, ["compilerOptions", "strict"], true, {
			formattingOptions: { insertSpaces: true, tabSize: 2 },
		});
		const updated = applyEdits(content, edits);

		await workspace.writeFile(tsConfigPath, updated);
		return { status: "updated" as const, file: fileName };
	} catch {
		return { status: "error" as const, file: fileName };
	}
}
