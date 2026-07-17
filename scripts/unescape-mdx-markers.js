import fs from "node:fs";
import path from "node:path";

/** Directory names that must never be walked (match mdxlint / build artifacts). */
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", ".source"]);

/**
 * Whether a path should be skipped during the MDX unescape walk.
 *
 * Skips build/VCS/deps trees and generated changelogs so Changesets'
 * intentional escapes (e.g. `\_` closing an italic span) are preserved.
 *
 * @param fullPath Absolute or relative path to a file or directory
 * @param entryName Basename of the entry
 * @param isDirectory Whether the entry is a directory
 * @returns `true` when the entry must not be processed
 */
export function shouldSkipUnescapePath(fullPath, entryName, isDirectory) {
	if (isDirectory && SKIP_DIRS.has(entryName)) {
		return true;
	}
	if (!isDirectory && entryName === "CHANGELOG.md") {
		return true;
	}
	// Also skip nested changelogs matched by path segment (defensive).
	if (!isDirectory && /(^|[/\\])CHANGELOG\.md$/.test(fullPath)) {
		return true;
	}
	return false;
}

/**
 * Walk a directory tree and unescape MDX markers that mdxlint over-escapes
 * (`\[!`, `\[step]`, `\_`, `:::x\[`).
 *
 * Honors the same practical exclusions as mdxlint: never enters
 * `node_modules` / `.git` / `dist` (and similar), and never rewrites
 * `CHANGELOG.md`.
 *
 * @param dir Root directory to walk
 */
export function unescapeMdxMarkers(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (shouldSkipUnescapePath(fullPath, entry.name, entry.isDirectory())) {
			continue;
		}
		if (entry.isDirectory()) {
			unescapeMdxMarkers(fullPath);
		} else if (
			entry.isFile() &&
			(entry.name.endsWith(".mdx") || entry.name.endsWith(".md"))
		) {
			let content = fs.readFileSync(fullPath, "utf8");
			let changed = false;
			if (content.includes("\\[!")) {
				content = content.replace(/\\\[!/g, "[!");
				changed = true;
			}
			if (content.includes("\\[step]")) {
				content = content.replace(/\\\[step\]/g, "[step]");
				changed = true;
			}
			if (content.includes("\\_")) {
				content = content.replace(/\\_/g, "_");
				changed = true;
			}
			if (/:::[a-z]+\\\[/.test(content)) {
				content = content.replace(/(:::[a-z]+)\\\[/g, "$1[");
				changed = true;
			}
			if (changed) {
				fs.writeFileSync(fullPath, content);
			}
		}
	}
}
