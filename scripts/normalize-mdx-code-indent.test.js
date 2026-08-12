import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	normalizeFenceBodyIndent,
	normalizeMdxCodeIndent,
	normalizeMdxCodeIndentContent,
} from "./normalize-mdx-code-indent.js";

/**
 * @type {string | undefined}
 */
let tempRoot;

beforeEach(() => {
	tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "normalize-mdx-indent-"));
});

afterEach(() => {
	if (tempRoot) {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
});

describe("normalizeFenceBodyIndent", () => {
	it("converts leading tabs to two spaces", () => {
		expect(
			normalizeFenceBodyIndent(
				["export const Env = type({", '\tNODE_ENV: "string",', "});"].join(
					"\n",
				),
			),
		).toBe(
			["export const Env = type({", '  NODE_ENV: "string",', "});"].join("\n"),
		);
	});

	it("preserves space-based indentation including trees", () => {
		const body = ["src/", "└── shared/", "    └── ports/"].join("\n");
		expect(normalizeFenceBodyIndent(body)).toBe(body);
	});

	it("leaves two-space indent unchanged", () => {
		const body = [
			"export const Env = type({",
			'  NODE_ENV: "string",',
			"});",
		].join("\n");
		expect(normalizeFenceBodyIndent(body)).toBe(body);
	});
});

describe("normalizeMdxCodeIndentContent", () => {
	it("normalizes only fenced code bodies", () => {
		const input = [
			"# Title",
			"",
			"\tOutside fence stays tabbed.",
			"",
			"```ts",
			"export const Env = type({",
			'\tDATABASE_URL: "string",',
			"});",
			"```",
			"",
			"Done.",
		].join("\n");

		const { content, changed } = normalizeMdxCodeIndentContent(input);

		expect(changed).toBe(true);
		expect(content).toBe(
			[
				"# Title",
				"",
				"\tOutside fence stays tabbed.",
				"",
				"```ts",
				"export const Env = type({",
				'  DATABASE_URL: "string",',
				"});",
				"```",
				"",
				"Done.",
			].join("\n"),
		);
	});

	it("handles twoslash meta and tildes", () => {
		const input = [
			"```ts twoslash",
			"const x = {",
			"\ta: 1,",
			"};",
			"```",
			"",
			"~~~bash",
			"echo hi",
			"~~~",
		].join("\n");

		const { content, changed } = normalizeMdxCodeIndentContent(input);

		expect(changed).toBe(true);
		expect(content).toContain("  a: 1,");
		expect(content).toContain("~~~bash");
	});

	it("reports unchanged when already normalized", () => {
		const input = ["```ts", "const x = {", "  a: 1,", "};", "```"].join("\n");
		const { changed } = normalizeMdxCodeIndentContent(input);
		expect(changed).toBe(false);
	});
});

describe("normalizeMdxCodeIndent", () => {
	it("rewrites markdown under the given directory", () => {
		const docsDir = path.join(tempRoot, "docs");
		fs.mkdirSync(docsDir, { recursive: true });
		const docPath = path.join(docsDir, "guide.mdx");
		fs.writeFileSync(
			docPath,
			["```ts", "const x = {", "\ta: 1,", "};", "```"].join("\n"),
		);

		normalizeMdxCodeIndent(docsDir);

		expect(fs.readFileSync(docPath, "utf8")).toBe(
			["```ts", "const x = {", "  a: 1,", "};", "```"].join("\n"),
		);
	});

	it("does not rewrite CHANGELOG.md or enter node_modules", () => {
		const packagesDir = path.join(tempRoot, "packages", "core");
		const nodeModulesDoc = path.join(tempRoot, "node_modules", "pkg");
		fs.mkdirSync(packagesDir, { recursive: true });
		fs.mkdirSync(nodeModulesDoc, { recursive: true });

		const changelogPath = path.join(packagesDir, "CHANGELOG.md");
		const nodeModulesPath = path.join(nodeModulesDoc, "readme.md");
		const tabbed = ["```ts", "\tconst x = 1;", "```"].join("\n");

		fs.writeFileSync(changelogPath, tabbed);
		fs.writeFileSync(nodeModulesPath, tabbed);
		fs.writeFileSync(path.join(tempRoot, "ok.mdx"), tabbed);

		normalizeMdxCodeIndent(tempRoot);

		expect(fs.readFileSync(changelogPath, "utf8")).toBe(tabbed);
		expect(fs.readFileSync(nodeModulesPath, "utf8")).toBe(tabbed);
		expect(fs.readFileSync(path.join(tempRoot, "ok.mdx"), "utf8")).toBe(
			["```ts", "  const x = 1;", "```"].join("\n"),
		);
	});
});
