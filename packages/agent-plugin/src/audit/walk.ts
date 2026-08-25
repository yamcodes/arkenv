import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { isSourceFile, shouldSkipDir } from "./rules";

export type ProjectFile = {
	filePath: string;
	source: string;
};

/**
 * Recursively collect JS/TS source files under `root`.
 *
 * @param root Project directory
 * @returns Source files with contents
 */
export async function collectSourceFiles(root: string): Promise<ProjectFile[]> {
	const files: ProjectFile[] = [];
	await walk(root, files);
	return files;
}

async function walk(dir: string, files: ProjectFile[]): Promise<void> {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (shouldSkipDir(entry.name) || entry.name.startsWith(".")) continue;
			await walk(full, files);
			continue;
		}
		if (!isSourceFile(full)) continue;
		const source = await readFile(full, "utf8");
		files.push({ filePath: full, source });
	}
}
