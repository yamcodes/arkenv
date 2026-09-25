import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CLASSIC_TYPESCRIPT_IMPORT =
	/(?:from\s+|require\s*\(\s*|import\s*\(\s*|import\s+)["'](?:@typescript\/typescript6|typescript(?!\/unstable\/)(?:\/[^"']*)?)["']/;

async function sourceFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await sourceFiles(full)));
			continue;
		}
		if (/\.(?:ts|tsx|mts|cts|js|mjs|cjs)$/.test(entry.name)) files.push(full);
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

	it("flags dynamic, side-effect, and subpath typescript imports", () => {
		const quote = '"';
		const specifier = "typescript";
		const samples = [
			`from ${quote}${specifier}${quote}`,
			`require(${quote}${specifier}${quote})`,
			`import(${quote}${specifier}${quote})`,
			`import ${quote}${specifier}${quote}`,
			`from ${quote}${specifier}/lib/typescript.js${quote}`,
		];
		for (const sample of samples) {
			expect(CLASSIC_TYPESCRIPT_IMPORT.test(sample)).toBe(true);
		}
		const unstable = `from ${quote}${specifier}/unstable/sync${quote}`;
		expect(CLASSIC_TYPESCRIPT_IMPORT.test(unstable)).toBe(false);
	});
});
