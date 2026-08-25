import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const WWW_ROOT = join(import.meta.dirname, "..");

/**
 * Legacy package-scoped docs trees removed in the Simplify Docs nav revamp.
 */
const LEGACY_HREF =
	/["'`](\/?docs\/(?:arkenv|cli|nextjs|nuxt|vite-plugin|bun-plugin)(?:\/[^"'`#?]*)?)["'`]/g;

const SKIP_DIR_NAMES = new Set([
	"node_modules",
	".next",
	".source",
	"dist",
	"coverage",
]);

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		if (SKIP_DIR_NAMES.has(name) || name.startsWith(".")) continue;
		const path = join(dir, name);
		const stat = statSync(path);
		if (stat.isDirectory()) {
			out.push(...walk(path));
			continue;
		}
		if (/\.(tsx?|mdx?|jsx?)$/.test(name) && name !== "next.config.ts") {
			out.push(path);
		}
	}
	return out;
}

describe("docs legacy links", () => {
	it("does not href legacy package-scoped docs paths outside next.config redirects", () => {
		const hits: string[] = [];
		for (const file of walk(WWW_ROOT)) {
			const text = readFileSync(file, "utf8");
			for (const match of text.matchAll(LEGACY_HREF)) {
				hits.push(`${relative(WWW_ROOT, file)}: ${match[1]}`);
			}
		}
		expect(hits).toEqual([]);
	});

	it("does not use root-relative docs hrefs missing a leading slash", () => {
		const hits: string[] = [];
		const pattern = /\bhref=["']docs\//g;
		for (const file of walk(WWW_ROOT)) {
			const text = readFileSync(file, "utf8");
			if (pattern.test(text)) {
				hits.push(relative(WWW_ROOT, file));
			}
			pattern.lastIndex = 0;
		}
		expect(hits).toEqual([]);
	});
});
