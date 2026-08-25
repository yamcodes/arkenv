/**
 * PostHog feature flag keys.
 * Keep each flag consumed in as few places as possible.
 */
export enum FeatureFlag {
	/**
	 * When true, show the light/dark/system theme switcher. Default: off.
	 * While off, `AppRootProvider` forces dark via `forcedTheme` — remove that
	 * when turning this flag on so light/system can take effect again.
	 */
	THEME_TOGGLE = "theme-toggle",
}
