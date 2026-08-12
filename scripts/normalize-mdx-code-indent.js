import fs from "node:fs";
import path from "node:path";
import { shouldSkipUnescapePath } from "./unescape-mdx-markers.js";

/** Spaces each leading tab becomes when normalizing fence bodies. */
const SPACES_PER_TAB = 2;

/**
 * Normalize leading indentation in a fenced code body to two spaces.
 *
 * Leading tabs become two spaces each. Existing space indentation is left
 * alone so ASCII trees and aligned annotations stay intact.
 *
 * @param {string} body Fence body (no opening/closing fence lines)
 * @returns {string} Normalized body
 */
export function normalizeFenceBodyIndent(body) {
	return body
		.split("\n")
		.map((line) => {
			const match = line.match(/^[ \t]+/);
			if (!match) {
				return line;
			}
			let indent = 0;
			for (const ch of match[0]) {
				indent += ch === "\t" ? SPACES_PER_TAB : 1;
			}
			return " ".repeat(indent) + line.slice(match[0].length);
		})
		.join("\n");
}

/**
 * Normalize indentation inside every fenced code block in markdown/MDX text.
 *
 * @param {string} content File contents
 * @returns {{ content: string, changed: boolean }}
 */
export function normalizeMdxCodeIndentContent(content) {
	const fencePattern =
		/(^|\n)(```|~~~)([^\n]*)\n([\s\S]*?)(\n\2)([ \t]*)(?=\n|$)/g;

	let changed = false;
	const next = content.replace(
		fencePattern,
		(full, prefix, fence, info, body, close, closeSpaces) => {
			const normalized = normalizeFenceBodyIndent(body);
			if (normalized !== body) {
				changed = true;
			}
			return `${prefix}${fence}${info}\n${normalized}${close}${closeSpaces}`;
		},
	);

	return { content: next, changed };
}

/**
 * Walk a directory tree and normalize fenced code indentation in `.md` / `.mdx`.
 *
 * Uses the same skip rules as {@link shouldSkipUnescapePath}.
 *
 * @param {string} dir Root directory to walk
 */
export function normalizeMdxCodeIndent(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (shouldSkipUnescapePath(entry.name, entry.isDirectory())) {
			continue;
		}
		if (entry.isDirectory()) {
			normalizeMdxCodeIndent(fullPath);
		} else if (
			entry.isFile() &&
			(entry.name.endsWith(".mdx") || entry.name.endsWith(".md"))
		) {
			const original = fs.readFileSync(fullPath, "utf8");
			const { content, changed } = normalizeMdxCodeIndentContent(original);
			if (changed) {
				fs.writeFileSync(fullPath, content);
			}
		}
	}
}
