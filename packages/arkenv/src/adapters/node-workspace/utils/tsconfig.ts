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

const ARKENV_FACTORY_ALIAS = "@/.arkenv";
const ARKENV_FACTORY_TARGET = ["./.arkenv/index.ts"];
const ARKENV_INCLUDE_GLOB = ".arkenv/**/*.ts";
const JSONC_FORMAT = { insertSpaces: true, tabSize: 2 };

/**
 * Point TypeScript at `.arkenv/index.ts` so `import arkenv from "@/.arkenv"`
 * typechecks even when `@/*` maps to `src/*`. Codegen keeps that barrel in
 * sync with a custom `outputPath`.
 *
 * @param workspace File read/write adapter
 * @param filePath Optional tsconfig path; defaults to discovering tsconfig.json
 * @returns Whether the file was updated
 */
export async function ensureNextjsArkEnvTsConfig(
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
		let content = await workspace.readFile(tsConfigPath);
		const parsed = parse(content) as {
			compilerOptions?: { paths?: Record<string, string[]> };
			include?: string[];
		};
		let changed = false;

		const existingAlias =
			parsed?.compilerOptions?.paths?.[ARKENV_FACTORY_ALIAS];
		if (!existingAlias || existingAlias[0] !== ARKENV_FACTORY_TARGET[0]) {
			const edits = modify(
				content,
				["compilerOptions", "paths", ARKENV_FACTORY_ALIAS],
				ARKENV_FACTORY_TARGET,
				{ formattingOptions: JSONC_FORMAT },
			);
			content = applyEdits(content, edits);
			changed = true;
		}

		const include = Array.isArray(parsed?.include) ? parsed.include : [];
		if (!include.includes(ARKENV_INCLUDE_GLOB)) {
			const edits = modify(
				content,
				["include"],
				[...include, ARKENV_INCLUDE_GLOB],
				{ formattingOptions: JSONC_FORMAT },
			);
			content = applyEdits(content, edits);
			changed = true;
		}

		if (!changed) {
			return { status: "already_configured" as const, file: fileName };
		}

		await workspace.writeFile(tsConfigPath, content);
		return { status: "updated" as const, file: fileName };
	} catch {
		return { status: "error" as const, file: fileName };
	}
}
