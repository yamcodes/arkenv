/**
 * PostHog feature flag keys.
 * Keep each flag consumed in as few places as possible.
 */
export enum FeatureFlag {
	/** When true, show the light/dark/system theme switcher. Default: off. */
	THEME_TOGGLE = "theme-toggle",
}
