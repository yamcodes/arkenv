import { RELEASE_TAG } from "./config/release";

const RUNNER_COMMAND_REGEX =
	/\b(npx|pnpm\s+dlx|bunx|yarn\s+dlx)(\s+(?:--?[^\s`'"]+\s+)*)(?<![@\w-])arkenv(?:@[^\s/`'"]+)?(?=[\s`'"]|$)/g;

const INSTALL_LINE_REGEX =
	/^(\s*)(npm install|pnpm add|yarn add|bun install)(\b.*)$/;

/** Bare or tagged scoped @arkenv/* package on an install line. */
const SCOPED_ARKENV_PACKAGE_REGEX =
	/@(arkenv\/[\w-]+)(?:@[^\s/`'"]+)?(?=[\s`'"]|$)/g;

/**
 * Tags bare `@arkenv/...` packages on install lines with the active release tag.
 * Does not rewrite packages that already have an `@tag` / version suffix.
 * When `activeTag` is empty (GA), strips any existing tag/version suffix.
 */
function normalizeScopedArkenvOnInstallLine(
	line: string,
	activeTag: string,
): string {
	const match = line.match(INSTALL_LINE_REGEX);
	if (!match) {
		return line;
	}

	const [, indent = "", verb = "", rest = ""] = match;
	const normalizedRest = rest.replaceAll(
		SCOPED_ARKENV_PACKAGE_REGEX,
		(full, pkg: string) => {
			if (!activeTag) {
				return `@${pkg}`;
			}
			// Already tagged/versioned — do not double-tag or rewrite.
			if (full !== `@${pkg}`) {
				return full;
			}
			return `@${pkg}@${activeTag}`;
		},
	);

	return `${indent}${verb}${normalizedRest}`;
}

/**
 * Canonical verbs and release tagging in docs code fences and install tabs.
 * Tags CLI runners and bare scoped packages on install lines via RELEASE_TAG.
 * Already-tagged scoped packages are left alone; empty tag strips scoped tags.
 * Scoped packages on runner lines are preserved.
 *
 * @param value - Raw command or multi-line script content.
 * @param tag - Release tag to apply (defaults to RELEASE_TAG).
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

	const withRunners = normalized.replaceAll(
		RUNNER_COMMAND_REGEX,
		(_: string, runner: string, flags: string) =>
			`${runner}${flags}${arkenvReplacement}`,
	);

	return withRunners
		.split("\n")
		.map((line) => normalizeScopedArkenvOnInstallLine(line, activeTag))
		.join("\n");
}
