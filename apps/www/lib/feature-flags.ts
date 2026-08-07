/**
 * www feature flags. Prefer a single callsite per flag.
 * Enable with `NEXT_PUBLIC_<FLAG>=true`.
 */
export const FeatureFlags = {
	/** Show GitHub star counts next to GH links (header + mobile CTA). */
	GITHUB_STAR_COUNT: process.env.NEXT_PUBLIC_GITHUB_STAR_COUNT === "true",
} as const;
