const rawTag =
	process.env.NEXT_PUBLIC_ARKENV_RELEASE_TAG ??
	process.env.ARKENV_RELEASE_TAG ??
	"alpha";

/**
 * The active release channel tag for ArkEnv CLI (e.g. "alpha", "rc", or "" for GA).
 */
export const RELEASE_TAG = rawTag.trim();

export type PackageManager = "npm" | "pnpm" | "bun" | "yarn";

/**
 * Returns the npm package specifier with an optional release tag.
 * When the tag is empty or falsy, returns the bare package name.
 *
 * @param pkg - Package name (defaults to "arkenv").
 * @param tag - Release tag override (defaults to `RELEASE_TAG`).
 * @returns Formatted package specifier (e.g. "arkenv@alpha" or "arkenv").
 */
export function getPackageSpecifier(pkg = "arkenv", tag = RELEASE_TAG): string {
	const trimmedTag = tag.trim();
	return trimmedTag ? `${pkg}@${trimmedTag}` : pkg;
}

/**
 * Returns the CLI command for the given package manager and release tag.
 *
 * @param packageManager - The target package manager ("npm", "pnpm", "bun", or "yarn").
 * @param tag - Release tag override (defaults to `RELEASE_TAG`).
 * @param args - CLI arguments to append (defaults to "init").
 * @returns The formatted command string (e.g. "npx arkenv@alpha init").
 */
export function getInitCommand(
	packageManager: PackageManager = "npm",
	tag = RELEASE_TAG,
	args = "init",
): string {
	const specifier = getPackageSpecifier("arkenv", tag);
	const trimmedArgs = args.trim();
	const suffix = trimmedArgs ? ` ${trimmedArgs}` : "";

	switch (packageManager) {
		case "npm":
			return `npx ${specifier}${suffix}`;
		case "pnpm":
			return `pnpm dlx ${specifier}${suffix}`;
		case "bun":
			return `bunx ${specifier}${suffix}`;
		case "yarn":
			return `yarn dlx ${specifier}${suffix}`;
	}
}

/**
 * Returns the standard AI agent onboarding prompt formatted with the active release tag.
 *
 * @param tag - Release tag override (defaults to `RELEASE_TAG`).
 * @returns Formatted prompt string for AI coding agents.
 */
export function getAgentPrompt(tag = RELEASE_TAG): string {
	const command = getInitCommand("npm", tag, "init --agent");
	return `Set up ArkEnv with \`${command}\`. Install any missing dependencies, wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime.`;
}

/**
 * Centralized release configuration object.
 */
export const RELEASE_CONFIG = {
	channel: RELEASE_TAG,
	tag: RELEASE_TAG,
	packageSpecifier: getPackageSpecifier("arkenv", RELEASE_TAG),
	initCommand: getInitCommand("npm", RELEASE_TAG, "init"),
	agentPrompt: getAgentPrompt(RELEASE_TAG),
} as const;
