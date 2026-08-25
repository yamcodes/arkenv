import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const DOCS_ROOT = join(import.meta.dirname, "../content/docs");

const FENCE = /```package-install\n(.*?)```/gs;

/**
 * Fumadocs `remarkNpm` prepends `npm install ` unless the fence already starts
 * with `npm` or `npx`. Author `npm install …` / `npx …`, not `npm i` or `pnpm add`.
 */
function asRemarkNpmInput(body: string): string {
	const lines = body.replace(/\n$/, "").split("\n");
	const indents = lines
		.filter((line) => line.trim().length > 0)
		.map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0);
	const indent = indents.length > 0 ? Math.min(...indents) : 0;
	return lines.map((line) => line.slice(indent)).join("\n");
}

function walkMdx(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		const stat = statSync(path);
		if (stat.isDirectory()) {
			out.push(...walkMdx(path));
			continue;
		}
		if (name.endsWith(".mdx")) out.push(path);
	}
	return out;
}

describe("package-install fences", () => {
	it("authors npm install / npx so tabs do not concatenate or use npm i", () => {
		const hits: string[] = [];
		for (const file of walkMdx(DOCS_ROOT)) {
			const text = readFileSync(file, "utf8");
			const rel = relative(DOCS_ROOT, file);
			for (const match of text.matchAll(FENCE)) {
				const code = asRemarkNpmInput(match[1] ?? "");
				for (const line of code.split("\n")) {
					const trimmed = line.trim();
					if (trimmed.length === 0) continue;
					if (
						/^(npx |npm install\b|npm rm |npm run |cd |cp )/.test(
							trimmed,
						)
					) {
						continue;
					}
					hits.push(`${rel}: ${JSON.stringify(trimmed)}`);
				}
			}
		}
		expect(hits).toEqual([]);
	});
});
