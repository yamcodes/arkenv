import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	shouldSkipUnescapePath,
	unescapeMdxMarkers,
} from "./unescape-mdx-markers.js";

/**
 * @type {string | undefined}
 */
let tempRoot;

beforeEach(() => {
	tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "unescape-mdx-"));
});

afterEach(() => {
	if (tempRoot) {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
});

describe("shouldSkipUnescapePath", () => {
	it("skips node_modules, .git, dist, and similar directories", () => {
		for (const name of ["node_modules", ".git", "dist", ".next", ".source"]) {
			expect(shouldSkipUnescapePath(`/repo/${name}`, name, true)).toBe(true);
		}
	});

	it("skips CHANGELOG.md files", () => {
		expect(
			shouldSkipUnescapePath(
				"/repo/packages/cli/CHANGELOG.md",
				"CHANGELOG.md",
				false,
			),
		).toBe(true);
	});

	it("does not skip ordinary docs markdown", () => {
		expect(
			shouldSkipUnescapePath(
				"/repo/apps/www/content/docs/guide.mdx",
				"guide.mdx",
				false,
			),
		).toBe(false);
		expect(shouldSkipUnescapePath("/repo/docs", "docs", true)).toBe(false);
	});
});

describe("unescapeMdxMarkers", () => {
	it("unescapes docs markers under the given directory", () => {
		const docsDir = path.join(tempRoot, "docs");
		fs.mkdirSync(docsDir, { recursive: true });
		const docPath = path.join(docsDir, "guide.mdx");
		fs.writeFileSync(
			docPath,
			["\\[!NOTE]", "\\[step]", "hello\\_world", ":::tabs\\[group]"].join("\n"),
		);

		unescapeMdxMarkers(docsDir);

		expect(fs.readFileSync(docPath, "utf8")).toBe(
			["[!NOTE]", "[step]", "hello_world", ":::tabs[group]"].join("\n"),
		);
	});

	it("does not rewrite CHANGELOG.md", () => {
		const packagesDir = path.join(tempRoot, "packages", "cli");
		fs.mkdirSync(packagesDir, { recursive: true });

		const changelogPath = path.join(packagesDir, "CHANGELOG.md");
		const escapedChangelog = "[@yamcodes](https://github.com/yamcodes)\\_";
		fs.writeFileSync(changelogPath, escapedChangelog);
		fs.writeFileSync(path.join(tempRoot, "readme.md"), "plain\\_ok");

		unescapeMdxMarkers(tempRoot);

		expect(fs.readFileSync(changelogPath, "utf8")).toBe(escapedChangelog);
		expect(fs.readFileSync(path.join(tempRoot, "readme.md"), "utf8")).toBe(
			"plain_ok",
		);
	});

	it("does not enter node_modules or dist trees", () => {
		const nodeModulesDoc = path.join(tempRoot, "node_modules", "pkg");
		const distDoc = path.join(tempRoot, "dist");
		fs.mkdirSync(nodeModulesDoc, { recursive: true });
		fs.mkdirSync(distDoc, { recursive: true });

		const nodeModulesPath = path.join(nodeModulesDoc, "readme.md");
		const distPath = path.join(distDoc, "readme.md");
		const escaped = "keep\\_escaped";
		fs.writeFileSync(nodeModulesPath, escaped);
		fs.writeFileSync(distPath, escaped);
		fs.writeFileSync(path.join(tempRoot, "ok.mdx"), "plain\\_text");

		unescapeMdxMarkers(tempRoot);

		expect(fs.readFileSync(nodeModulesPath, "utf8")).toBe(escaped);
		expect(fs.readFileSync(distPath, "utf8")).toBe(escaped);
		expect(fs.readFileSync(path.join(tempRoot, "ok.mdx"), "utf8")).toBe(
			"plain_text",
		);
	});
});
