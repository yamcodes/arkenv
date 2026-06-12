import fs from "node:fs";
import path from "node:path";
import type { LayoutMode, ResolvedLayout } from "./types";

/**
 * Resolve the layout mode and base directory for a given schema file path.
 *
 * @param schemaPath The absolute path to the schema file or directory
 * @param layoutOption An optional explicit layout configuration ("simple" or "strict")
 * @returns An object containing the resolved layout mode and the base directory path
 * @throws An error if explicit "strict" layout is requested but required split files are missing
 */
export function resolveLayout(
	schemaPath: string,
	layoutOption?: LayoutMode,
): ResolvedLayout {
	const checkStrict = (dir: string) =>
		fs.existsSync(path.join(dir, "internal", "shared.ts")) &&
		fs.existsSync(path.join(dir, "client.ts")) &&
		fs.existsSync(path.join(dir, "server.ts"));

	const resolveBaseDir = (p: string): string => {
		const ext = path.extname(p);
		const baseWithoutExt = ext ? p.slice(0, -ext.length) : p;
		if (
			fs.existsSync(baseWithoutExt) &&
			fs.statSync(baseWithoutExt).isDirectory()
		) {
			return baseWithoutExt;
		}
		return p;
	};

	if (!layoutOption) {
		const resolved = resolveBaseDir(schemaPath);
		if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
			if (checkStrict(resolved)) {
				return { layout: "strict", baseDir: resolved };
			}
			return { layout: "simple", baseDir: resolved };
		}

		const parent = path.dirname(schemaPath);
		const ext = path.extname(schemaPath);
		const baseWithoutExt = ext ? schemaPath.slice(0, -ext.length) : schemaPath;
		if (
			fs.existsSync(baseWithoutExt) &&
			fs.statSync(baseWithoutExt).isDirectory() &&
			checkStrict(baseWithoutExt)
		) {
			return { layout: "strict", baseDir: baseWithoutExt };
		}
		if (checkStrict(parent)) {
			return { layout: "strict", baseDir: parent };
		}
		if (
			path.basename(parent) === "internal" &&
			checkStrict(path.dirname(parent))
		) {
			return { layout: "strict", baseDir: path.dirname(parent) };
		}
		return { layout: "simple", baseDir: schemaPath };
	}

	if (layoutOption === "strict") {
		let baseDir: string;
		const resolved = resolveBaseDir(schemaPath);
		if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
			baseDir = resolved;
		} else {
			const parent = path.dirname(schemaPath);
			if (path.basename(parent) === "internal") {
				baseDir = path.dirname(parent);
			} else {
				baseDir = parent;
			}
		}

		const clientPath = path.join(baseDir, "client.ts");
		const sharedPath = path.join(baseDir, "internal", "shared.ts");
		if (!fs.existsSync(clientPath) || !fs.existsSync(sharedPath)) {
			throw new Error(
				`[ArkEnv] Strict layout requires "${clientPath}" and "${sharedPath}" to exist. ` +
					`Ensure both files are present or remove the 'layout: "strict"' option to let ArkEnv auto-detect.`,
			);
		}

		return { layout: "strict", baseDir };
	}

	return { layout: "simple", baseDir: schemaPath };
}

/**
 * Find the path to the schema file or directory in the project.
 *
 * @param cwd The working directory to search from (defaults to process.cwd())
 * @returns The absolute path to the schema file/directory, or null if not found
 */
export function findSchemaPath(cwd = process.cwd()): string | null {
	const possiblePaths = [
		path.join(cwd, "src", "env.ts"),
		path.join(cwd, "env.ts"),
	];
	for (const p of possiblePaths) {
		if (fs.existsSync(p)) return p;
	}

	const possibleDirs = [path.join(cwd, "src", "env"), path.join(cwd, "env")];
	for (const d of possibleDirs) {
		if (
			fs.existsSync(d) &&
			fs.existsSync(path.join(d, "internal", "shared.ts")) &&
			fs.existsSync(path.join(d, "client.ts")) &&
			fs.existsSync(path.join(d, "server.ts"))
		) {
			return d;
		}
	}
	return null;
}
