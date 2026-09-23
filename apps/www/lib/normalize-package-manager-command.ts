import { INSTALL_TAG } from "./config/release";

const RUNNER_COMMAND_REGEX =
	/\b(npx|pnpm\s+dlx|bunx|nubx|yarn\s+dlx)(\s+(?:--?[^\s`'"]+\s+)*)(?<![@\w-])arkenv(?:@[^\s/`'"]+)?(?=[\s`'"]|$)/g;

const INSTALL_LINE_REGEX =
	/(^|\n)(npm install|pnpm add|yarn add|bun install|nub add)([^\n]*)/g;

const SCOPED_ARKENV_PACKAGE_REGEX = /@arkenv\/[\w-]+(?:@[^\s/`'"]+)?/g;

function withReleaseTag(specifier: string, tag: string): string {
	const match = specifier.match(/^(@arkenv\/[\w-]+)(?:@(.+))?$/);
	if (!match) return specifier;
	const name = match[1];
	return tag ? `${name}@${tag}` : name;
}

/**
 * Canonical verbs and release tagging in docs code fences and install tabs:
 * - npm install / pnpm add / yarn add / bun install / nub add (not npm i,
 *   not bun add).
 * - bun x -> bunx.
 * - arkenv CLI runner commands use bare `arkenv` when {@link INSTALL_TAG} is
 *   empty (intended once product `latest` → RC), or `@${tag}` when an override
 *   is passed.
 * - On install lines only, `@arkenv/*` packages are tagged the same way (or
 *   left bare when the tag is empty).
 * - Scoped packages on runner lines (such as `@arkenv/agent-plugin`) are preserved untagged.
 * - Bare `arkenv` on install lines is left untagged.
 *
 * @param value - Raw command or multi-line script content.
 * @param tag - Install tag to apply (defaults to `INSTALL_TAG`).
 * @returns Normalized command string.
 */
export function normalizePackageManagerCommand(
	value: string,
	tag = INSTALL_TAG,
): string {
	const activeTag = tag.trim();
	const arkenvReplacement = activeTag ? `arkenv@${activeTag}` : "arkenv";

	const normalized = value
		.replaceAll(/(^|\n)npm i(?=\s|$)/g, "$1npm install")
		.replaceAll(/(^|\n)bun x /g, "$1bunx ")
		.replaceAll(/(^|\n)bun add(?=\s|$)/g, "$1bun install")
		.replaceAll(/\bbun\s+x\b/g, "bunx");

	const withRunners = normalized.replaceAll(
		RUNNER_COMMAND_REGEX,
		(_: string, runner: string, flags: string) =>
			`${runner}${flags}${arkenvReplacement}`,
	);

	return withRunners.replaceAll(
		INSTALL_LINE_REGEX,
		(_match: string, prefix: string, verb: string, rest: string) => {
			const taggedRest = rest.replaceAll(
				SCOPED_ARKENV_PACKAGE_REGEX,
				(specifier: string) => withReleaseTag(specifier, activeTag),
			);
			return `${prefix}${verb}${taggedRest}`;
		},
	);
}
