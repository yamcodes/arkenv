import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CLASSIC_TYPESCRIPT_IMPORT =
	/(?:from\s+|require\s*\(\s*)["']typescript["']/;

async function sourceFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await sourceFiles(full)));
			continue;
		}
		if (/\.(?:ts|tsx|js|mjs|cjs)$/.test(entry.name)) files.push(full);
	}
	return files;
}

describe("agent-plugin TypeScript import boundary", () => {
	it("does not import the classic typescript package", async () => {
		const files = await sourceFiles(SRC);
		const offenders: string[] = [];
		for (const file of files) {
			const source = await readFile(file, "utf8");
			if (CLASSIC_TYPESCRIPT_IMPORT.test(source)) {
				offenders.push(path.relative(SRC, file));
			}
		}
		expect(offenders).toEqual([]);
	});
});
