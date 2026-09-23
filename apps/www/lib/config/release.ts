const rawTag =
	process.env.NEXT_PUBLIC_ARKENV_RELEASE_TAG ??
	process.env.ARKENV_RELEASE_TAG ??
	"rc";

/**
 * The active release channel tag for ArkEnv (e.g. "alpha", "rc", or "" for GA).
 * Drives the Release Candidate badge and channel labeling — not install CTAs.
 */
export const RELEASE_TAG = rawTag.trim();

/**
 * npm dist-tag used in user-facing install / init copy.
 * Empty for bare CTAs (`npx arkenv init`, `pnpm add @arkenv/core`).
 * Independent of {@link RELEASE_TAG} so the Release Candidate badge can stay
 * on while install copy assumes product `latest` → RC. Do not ship this to a
 * public surface until that dist-tag (and the apex docs cutover) land.
 */
export const INSTALL_TAG = "";

export type PackageManager = "npm" | "pnpm" | "bun" | "yarn" | "nub";

/**
 * Default/fallback docs origin.
 * Apex (`https://arkenv.js.org`) serves the v1 / RC site after the domain
 * cutover; keep this as the no-env fallback so agent prompts and install copy
 * match production.
 */
export const FALLBACK_DOCS_URL = "https://arkenv.js.org";

/**
 * Resolves the docs origin for the current deployment.
 *
 * Preference order:
 * 1. `NEXT_PUBLIC_SITE_URL` (trimmed, no trailing slash)
 * 2. `https://${NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? VERCEL_PROJECT_PRODUCTION_URL}` (production domain)
 * 3. `https://${NEXT_PUBLIC_VERCEL_URL ?? VERCEL_URL}` (preview deployment host)
 * 4. Fallback docs URL (`https://arkenv.js.org`)
 *
 * Setting `NEXT_PUBLIC_SITE_URL` or the Vercel production URL makes the homepage
 * agent prompt auto-update when the site moves hosts without hardcoding.
 * Apex is a valid production host during RC (after Yam assigns the domain).
 *
 * @param env - Env bag to read (defaults to `process.env`; injectable for tests).
 * @returns Absolute docs origin with no trailing slash.
 */
function firstNonEmpty(
	...values: Array<string | undefined>
): string | undefined {
	for (const value of values) {
		const trimmed = value?.trim();
		if (trimmed) {
			return trimmed.replace(/\/+$/, "");
		}
	}
}

export function getDocsUrl(env: NodeJS.ProcessEnv = process.env): string {
	const siteUrl = firstNonEmpty(env.NEXT_PUBLIC_SITE_URL);
	if (siteUrl) {
		return siteUrl.startsWith("http://") || siteUrl.startsWith("https://")
			? siteUrl
			: `https://${siteUrl}`;
	}

	const productionHost = firstNonEmpty(
		env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
		env.VERCEL_PROJECT_PRODUCTION_URL,
	);
	if (productionHost) {
		return productionHost.startsWith("http://") ||
			productionHost.startsWith("https://")
			? productionHost
			: `https://${productionHost}`;
	}

	const previewHost = firstNonEmpty(env.NEXT_PUBLIC_VERCEL_URL, env.VERCEL_URL);
	if (previewHost) {
		return previewHost.startsWith("http://") ||
			previewHost.startsWith("https://")
			? previewHost
			: `https://${previewHost}`;
	}

	return FALLBACK_DOCS_URL;
}

/**
 * Returns the npm package specifier with an optional install tag.
 * When the tag is empty or falsy, returns the bare package name.
 *
 * @param pkg - Package name (defaults to "arkenv").
 * @param tag - Install tag override (defaults to `INSTALL_TAG`).
 * @returns Formatted package specifier (e.g. "arkenv@rc" or "arkenv").
 */
export function getPackageSpecifier(pkg = "arkenv", tag = INSTALL_TAG): string {
	const trimmedTag = tag.trim();
	return trimmedTag ? `${pkg}@${trimmedTag}` : pkg;
}

/**
 * Returns the CLI command for the given package manager and install tag.
 *
 * @param packageManager - The target package manager ("npm", "pnpm", "bun",
 *   "yarn", or "nub").
 * @param tag - Install tag override (defaults to `INSTALL_TAG`).
 * @param args - CLI arguments to append (defaults to "init").
 * @returns The formatted command string (e.g. "npx arkenv init").
 */
export function getInitCommand(
	packageManager: PackageManager = "npm",
	tag = INSTALL_TAG,
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
		case "nub":
			return `nubx ${specifier}${suffix}`;
	}
}

/**
 * Returns the `skills add` source. Always the short repo form now that `v1`
 * is the GitHub default branch.
 *
 * @returns Source argument for `npx skills add …`.
 */
export function getSkillsAddSource(): string {
	return "yamcodes/arkenv";
}

/**
 * Returns the standard AI agent onboarding prompt formatted with the active
 * install tag and the current deployment's docs URL.
 *
 * @param tag - Install tag override (defaults to INSTALL_TAG).
 * @param docsUrl - Docs origin override (defaults to getDocsUrl).
 * @returns Formatted prompt string for AI coding agents.
 */
export function getAgentPrompt(
	tag = INSTALL_TAG,
	docsUrl = getDocsUrl(),
): string {
	const command = getInitCommand("npm", tag, "init --agent");
	const skillsSource = getSkillsAddSource();
	return [
		`Set up ArkEnv with \`${command}\`.`,
		`For docs/reference, start from ${docsUrl}/llms.txt and fetch any linked pages as markdown (append \`.md\`).`,
		"Install the runtime engine as a dependency: `@arkenv/core` (with `arktype`) if ArkType is already in the project or there is no env validator yet; otherwise `@arkenv/standard` for use with the project's existing Standard Schema library (Zod, Valibot, etc.).",
		"Install the `arkenv` CLI as a devDependency.",
		"Use the project's package manager for installs.",
		"Wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime.",
		`When that works, suggest as a next step (do not install it yourself) that I install the ArkEnv skill with \`npx skills add ${skillsSource}\` — it teaches framework-specific env setup, keeping app code on \`import { env } from "./env"\`, and avoiding raw \`process.env\` / \`import.meta.env\`.`,
	].join(" ");
}

/**
 * Centralized release configuration object.
 */
export const RELEASE_CONFIG = {
	channel: RELEASE_TAG,
	tag: RELEASE_TAG,
	packageSpecifier: getPackageSpecifier("arkenv", INSTALL_TAG),
	initCommand: getInitCommand("npm", INSTALL_TAG, "init"),
	agentPrompt: getAgentPrompt(INSTALL_TAG),
} as const;
