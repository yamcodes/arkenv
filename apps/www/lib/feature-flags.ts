/**
 * www feature flags. Prefer a single callsite per flag.
 * Enable with `NEXT_PUBLIC_<FLAG>=true`.
 */
export const FeatureFlags = {
	/** Show GitHub star counts next to GH links (header + mobile CTA). */
	GITHUB_STAR_COUNT: process.env.NEXT_PUBLIC_GITHUB_STAR_COUNT === "true",
	/** Show Discord community links in chrome (footer, 404, etc.). */
	DISCORD_LINK: process.env.NEXT_PUBLIC_DISCORD_LINK === "true",
} as const;
