import { env } from "~/env";

/**
 * www feature flags. Prefer a single callsite per flag.
 * Enable with `NEXT_PUBLIC_<FLAG>=true`.
 */
export const FeatureFlags = {
	/**
	 * Show GitHub star counts next to GH links (header + mobile CTA).
	 */
	GITHUB_STAR_COUNT: env.NEXT_PUBLIC_GITHUB_STAR_COUNT,
	/**
	 * Show Discord community links in chrome (footer, 404, etc.).
	 */
	DISCORD_LINK: env.NEXT_PUBLIC_DISCORD_LINK,
	/**
	 * Show Fumadocs sticky “On this page” TOC popover below 1200px.
	 * Off by default — conflicts with the floating Site Nav (gap under the docs bar).
	 */
	DOCS_TOC_POPOVER: env.NEXT_PUBLIC_DOCS_TOC_POPOVER,
} as const;
