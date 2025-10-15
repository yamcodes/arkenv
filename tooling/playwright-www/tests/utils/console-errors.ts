import { expect, type Page } from "@playwright/test";

/**
 * Assert that there are no console errors on the given page after navigating to the URL.
 * Filter out known non-critical errors (403, Failed to load resource).
 *
 * @param page - The Playwright page instance
 * @param url - The URL to navigate to
 */
export async function assertNoConsoleErrors(
	page: Page,
	url: string,
): Promise<void> {
	const consoleErrors: string[] = [];

	page.on("console", (msg) => {
		if (msg.type() === "error") {
			// Filter out known non-critical errors
			const errorText = msg.text();
			if (
				!errorText.includes("403") &&
				!errorText.includes("Failed to load resource")
			) {
				consoleErrors.push(errorText);
			}
		}
	});

	await page.goto(url);
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1000);

	expect(consoleErrors).toHaveLength(0);
}
