import path from "node:path";
import type { ProjectScannerPort, WorkspacePort } from "@/shared/ports";

/**
 * Resolve the path to the project's schema module.
 *
 * Honors an explicit `--schema`/`--file` path first, then flat TypeScript
 * convention candidates (`env.ts`, `src/env.ts`). A `.js` or `.mjs` schema
 * loads only when that path is passed explicitly. Split-layout leftovers
 * such as `env/server.ts` are not auto-discovered — pass `--schema` at a
 * loadable module (typically the recipe client or a flat schema). Leftover
 * `package.json` `"arkenv"` fields are ignored — CLI schema location is
 * not a package.json config surface.
 *
 * @param cwd Working directory to search from
 * @param workspace Port used to test whether candidate files exist
 * @param scanner Port used to suggest a default path
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

	const candidates = [
		path.resolve(cwd, "env.ts"),
		path.resolve(cwd, "src/env.ts"),
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
