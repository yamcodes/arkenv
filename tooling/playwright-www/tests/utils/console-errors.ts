import { expect, type Page } from "@playwright/test";

interface ConsoleErrorOptions {
	/** Timeout for page navigation (default: 60000ms) */
	navigationTimeout?: number;
	/** Timeout for network idle state (default: 60000ms) */
	networkIdleTimeout?: number;
	/** Additional wait time after network idle (default: 1000ms for single URL, 500ms for multiple) */
	waitTimeout?: number;
}

/**
 * Check if an error is an HLS.js library error (not a generic media error).
 * Only filters HLS.js-specific errors to avoid suppressing legitimate app-level media errors.
 */
function isHlsJsLibraryError(errorText: string): boolean {
	// HLS.js library errors typically contain one of these patterns:
	// 1. getErrorFromHlsErrorData() function call - indicates HLS.js internal error handling
	// 2. HLS-specific error details like manifestIncompatibleCodecsError
	// 3. HLS manifest file references (.m3u8) combined with HLS error types
	// 4. HLS.js-specific error messages about codec compatibility

	const hasHlsJsIndicator =
		errorText.includes("getErrorFromHlsErrorData") ||
		errorText.includes("manifestIncompatibleCodecsError") ||
		errorText.includes("no level with compatible codecs found");

	// If mediaError is present, ensure it's in HLS.js context
	// by checking for HLS indicators or .m3u8 file references
	if (errorText.includes("mediaError")) {
		return (
			hasHlsJsIndicator ||
			errorText.includes(".m3u8") ||
			errorText.includes("hls") ||
			errorText.includes("manifest")
		);
	}

	return hasHlsJsIndicator;
}

/**
 * Check if an error is a PostHog initialization warning.
 * Filters PostHog warnings about missing API keys in non-CI environments.
 */
function isPostHogWarning(errorText: string): boolean {
	return (
		errorText.includes("[PostHog]") &&
		errorText.includes("NEXT_PUBLIC_POSTHOG_KEY is not set")
	);
}

/**
 * Check if an error is a video playback compatibility error.
 * Filters video errors that occur on Windows/WebKit due to codec compatibility issues.
 * This is a known limitation where WebKit on Windows cannot play certain video formats.
 */
function isVideoPlaybackError(errorText: string): boolean {
	return (
		errorText.includes("video you're trying to play will not work") ||
		errorText.includes("try upgrading to the newest versions of your browser")
	);
}

/**
 * Assert that there are no console errors on the given page after navigating to the URL(s).
 * Filter out known non-critical errors (403, Failed to load resource), HLS.js library errors,
 * PostHog initialization warnings, and video playback compatibility errors (Windows/WebKit).
 *
 * @param page - The Playwright page instance
 * @param urls - URLs to navigate to - can be a single URL or array of URLs
 * @param options - Configuration options for the test
 */
export async function assertNoConsoleErrors(
	page: Page,
	urls: string | string[],
	options: ConsoleErrorOptions = {},
): Promise<void> {
	const consoleErrors: string[] = [];

	page.on("console", (msg) => {
		if (msg.type() === "error") {
			// Filter out known non-critical errors
			const errorText = msg.text();

			// Filter out generic non-critical errors
			if (
				errorText.includes("403") ||
				errorText.includes("Failed to load resource")
			) {
				return; // Skip this error
			}

			// Filter out HLS.js library errors (but not generic media errors)
			if (isHlsJsLibraryError(errorText)) {
				return; // Skip HLS.js library errors
			}

			// Filter out PostHog initialization warnings
			if (isPostHogWarning(errorText)) {
				return; // Skip PostHog warnings
			}

			// Filter out video playback compatibility errors (Windows/WebKit limitation)
			if (isVideoPlaybackError(errorText)) {
				return; // Skip video playback errors (will fall back to gif)
			}

			// All other errors should be reported
			consoleErrors.push(errorText);
		}
	});

	const urlArray = Array.isArray(urls) ? urls : [urls];
	const navigationTimeout = options.navigationTimeout ?? 60000;
	const networkIdleTimeout = options.networkIdleTimeout ?? 60000;
	const waitTimeout =
		options.waitTimeout ?? (urlArray.length === 1 ? 1000 : 500);

	for (const url of urlArray) {
		await page.goto(url, { timeout: navigationTimeout });
		await page.waitForLoadState("networkidle", { timeout: networkIdleTimeout });
		await page.waitForTimeout(waitTimeout);
	}

	expect(consoleErrors).toHaveLength(0);
}
