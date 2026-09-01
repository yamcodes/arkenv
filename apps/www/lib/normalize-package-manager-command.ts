import { RELEASE_TAG } from "./config/release";

const RUNNER_COMMAND_REGEX =
	/\b(npx|pnpm\s+dlx|bunx|yarn\s+dlx)(\s+(?:--?[^\s`'"]+\s+)*)(?<![@\w-])arkenv(?:@[^\s/`'"]+)?(?=[\s`'"]|$)/g;

/**
 * Canonical verbs and release tagging in docs code fences and install tabs:
 * - npm install / pnpm add / yarn add / bun install (not npm i, not bun add).
 * - bun x -> bunx.
 * - arkenv CLI runner commands dynamically tag arkenv with `@${tag}` (e.g. `arkenv@alpha`),
 *   or bare `arkenv` when tag is empty.
 * - Scoped packages (such as `@arkenv/agent-plugin` or `@arkenv/core`) are preserved.
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

	const normalized = value
		.replaceAll(/(^|\n)npm i(?=\s|$)/g, "$1npm install")
		.replaceAll(/(^|\n)bun x /g, "$1bunx ")
		.replaceAll(/(^|\n)bun add(?=\s|$)/g, "$1bun install")
		.replaceAll(/\bbun\s+x\b/g, "bunx");

	return normalized.replaceAll(
		RUNNER_COMMAND_REGEX,
		(_, runner: string, flags: string) =>
			`${runner}${flags}${arkenvReplacement}`,
	);
}
