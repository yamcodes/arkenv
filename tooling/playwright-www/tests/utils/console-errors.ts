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
 * Assert that there are no console errors on the given page after navigating to the URL(s).
 * Filter out known non-critical errors (403, Failed to load resource).
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
			if (
				!errorText.includes("403") &&
				!errorText.includes("Failed to load resource") &&
				!errorText.includes("getErrorFromHlsErrorData") &&
				!errorText.includes("mediaError") &&
				!errorText.includes("manifestIncompatibleCodecsError") &&
				!errorText.includes("no level with compatible codecs found")
			) {
				consoleErrors.push(errorText);
			}
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
