const rawTag =
	process.env.NEXT_PUBLIC_ARKENV_RELEASE_TAG ??
	process.env.ARKENV_RELEASE_TAG ??
	"alpha";

/**
 * The active release channel tag for ArkEnv CLI (e.g. "alpha", "rc", or "" for GA).
 */
export const RELEASE_TAG = rawTag.trim();

export type PackageManager = "npm" | "pnpm" | "bun" | "yarn";

const FALLBACK_DOCS_URL = "https://arkenv.js.org";

/**
 * Resolves the docs origin for the current deployment.
 *
 * Preference order:
 * 1. `NEXT_PUBLIC_SITE_URL` (trimmed, no trailing slash)
 * 2. `https://${VERCEL_PROJECT_PRODUCTION_URL}` (production domain; flips when DNS moves)
 * 3. `https://${VERCEL_URL}` (preview deployment host)
 * 4. Fallback `https://arkenv.js.org`
 *
 * Setting `NEXT_PUBLIC_SITE_URL` or the Vercel production URL makes the homepage
 * agent prompt auto-update when the site moves off a preview host (e.g.
 * arkenv-v1.vercel.app → arkenv.js.org) without hardcoding the preview forever.
 *
 * @param env - Env bag to read (defaults to `process.env`; injectable for tests).
 * @returns Absolute docs origin with no trailing slash.
 */
export function getDocsUrl(env: NodeJS.ProcessEnv = process.env): string {
	const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
	if (siteUrl) {
		return siteUrl.startsWith("http://") || siteUrl.startsWith("https://")
			? siteUrl
			: `https://${siteUrl}`;
	}

	const productionHost = env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(
		/\/+$/,
		"",
	);
	if (productionHost) {
		return productionHost.startsWith("http://") ||
			productionHost.startsWith("https://")
			? productionHost
			: `https://${productionHost}`;
	}

	const previewHost = env.VERCEL_URL?.trim().replace(/\/+$/, "");
	if (previewHost) {
		return previewHost.startsWith("http://") ||
			previewHost.startsWith("https://")
			? previewHost
			: `https://${previewHost}`;
	}

	return FALLBACK_DOCS_URL;
}

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
 * Returns the standard AI agent onboarding prompt formatted with the active
 * release tag and the current deployment's docs URL.
 *
 * @param tag - Release tag override (defaults to RELEASE_TAG).
 * @param docsUrl - Docs origin override (defaults to getDocsUrl).
 * @returns Formatted prompt string for AI coding agents.
 */
export function getAgentPrompt(
	tag = RELEASE_TAG,
	docsUrl = getDocsUrl(),
): string {
	const command = getInitCommand("npm", tag, "init --agent");
	return [
		`Set up ArkEnv with \`${command}\`.`,
		`For docs/reference, start from ${docsUrl}/llms.txt and fetch any linked pages as markdown (append \`.md\`).`,
		"Install the runtime engine as a dependency: `@arkenv/core` (with `arktype`) if ArkType is already in the project or there is no env validator yet; otherwise `@arkenv/standard` for use with the project's existing Standard Schema library (Zod, Valibot, etc.).",
		"Install the `arkenv` CLI as a devDependency.",
		"Use the project's package manager for installs.",
		"Wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime.",
		"When that works, suggest as a next step (do not install it yourself) that I install the ArkEnv skill with `npx skills add yamcodes/arkenv` — it teaches framework-specific env setup, keeping app code on `import { env } from \"./env\"`, and avoiding raw `process.env` / `import.meta.env`.",
	].join(" ");
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
