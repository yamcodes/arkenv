import path from "node:path";
import type { ProjectScannerPort, WorkspacePort } from "@/shared/ports";

/**
 * Resolve the path to the project's schema module.
 *
 * Honors an explicit `--schema`/`--file` path first, then `package.json`
 * `"arkenv".schema`, then convention candidates (`env.ts`, `src/env.ts`, …).
 *
 * @param cwd Working directory to search from
 * @param workspace Port used to test whether candidate files exist
 * @param scanner Port used to read package config and suggest a default path
 * @param explicitPath Optional explicit schema path from `--schema` or `--file`
 * @returns Absolute path to an existing schema file, or undefined if none is found
 */
export async function resolveSchemaPath(
	cwd: string,
	workspace: WorkspacePort,
	scanner: ProjectScannerPort,
	explicitPath?: string,
): Promise<string | undefined> {
	if (explicitPath) {
		const resolved = path.resolve(cwd, explicitPath);
		return (await workspace.exists(resolved)) ? resolved : undefined;
	}

	if (typeof scanner.readArkenvConfig === "function") {
		const arkenvConfig = await scanner.readArkenvConfig(cwd);
		if (arkenvConfig) {
			const resolved = path.resolve(cwd, arkenvConfig.schema);
			if (await workspace.exists(resolved)) {
				return resolved;
			}
		}
	}

	const candidates = [
		path.resolve(cwd, "env.ts"),
		path.resolve(cwd, "src/env.ts"),
		path.resolve(cwd, "env.js"),
		path.resolve(cwd, "src/env.js"),
		path.resolve(cwd, "env.mjs"),
		path.resolve(cwd, "src/env.mjs"),
		path.resolve(cwd, "env/server.ts"),
		path.resolve(cwd, "src/env/server.ts"),
	];

	const suggested = await scanner.suggestDefaultEnvPath(cwd);
	if (suggested) {
		candidates.unshift(path.resolve(cwd, suggested));
	}

	for (const candidate of candidates) {
		if (await workspace.exists(candidate)) {
			return candidate;
		}
	}

	return undefined;
}
