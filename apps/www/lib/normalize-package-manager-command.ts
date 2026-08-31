import { RELEASE_TAG } from "./config/release";

const RUNNER_LINE_REGEX = /^[ \t]*(?:npx|pnpm\s+dlx|bun\s+x|bunx|yarn\s+dlx)\b/;

/**
 * Canonical verbs and release tagging in docs install tabs:
 * - npm install / pnpm add / yarn add / bun install (not npm i, not bun add).
 * - bun x -> bunx.
 * - arkenv CLI runner commands dynamically tag arkenv with `@${tag}` (e.g. `arkenv@alpha`),
 *   or bare `arkenv` when tag is empty.
 *
 * @param value - Raw command or multi-line script content.
 * @param tag - Release tag to apply to runner commands (defaults to `RELEASE_TAG`).
 * @returns Normalized command string.
 */
export function normalizePackageManagerCommand(
	value: string,
	tag = RELEASE_TAG,
): string {
	const activeTag = tag.trim();
	const arkenvReplacement = activeTag ? `arkenv@${activeTag}` : "arkenv";

	const lines = value
		.replaceAll(/(^|\n)npm i(?=\s|$)/g, "$1npm install")
		.replaceAll(/(^|\n)bun x /g, "$1bunx ")
		.replaceAll(/(^|\n)bun add(?=\s|$)/g, "$1bun install")
		.split("\n");

	const normalizedLines = lines.map((line) => {
		if (RUNNER_LINE_REGEX.test(line)) {
			return line.replace(/\barkenv(?:@[^\s/]+)?/g, arkenvReplacement);
		}
		return line;
	});

	return normalizedLines.join("\n");
}
