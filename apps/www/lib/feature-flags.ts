/**
 * www feature flags. Prefer a single callsite per flag.
 * Enable with `NEXT_PUBLIC_<FLAG>=true`.
 */
export const FeatureFlags = {
	/**
	 * Show GitHub star counts next to GH links (header + mobile CTA).
	 */
	GITHUB_STAR_COUNT: process.env.NEXT_PUBLIC_GITHUB_STAR_COUNT === "true",
	/**
	 * Show Discord community links in chrome (footer, 404, etc.).
	 */
	DISCORD_LINK: process.env.NEXT_PUBLIC_DISCORD_LINK === "true",
	/**
	 * Show Fumadocs sticky “On this page” TOC popover below xl.
	 * Off by default — conflicts with the floating Site Nav (gap under the docs bar).
	 */
	DOCS_TOC_POPOVER: process.env.NEXT_PUBLIC_DOCS_TOC_POPOVER === "true",
} as const;
