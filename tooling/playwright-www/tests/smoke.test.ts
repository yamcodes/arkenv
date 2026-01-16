import { expect, test } from "@playwright/test";
import { assertNoA11yViolations } from "./utils/a11y";
import { assertNoConsoleErrors } from "./utils/console-errors";

/**
 * Smoke Tests
 *
 * Logic:
 * 1. Verify all top-level routes load successfully.
 * 2. Monitor for console errors.
 * 3. Perform a11y scans on each route.
 * 4. Verify basic HTML structure (main, h1).
 *
 * Why: This is much more stable than testing specific text content
 * which changes frequently during documentation updates.
 */

test.describe("Smoke Tests", () => {
	test.setTimeout(120000);

	const topRoutes = [
		"/",
		"/docs/arkenv",
		"/docs/arkenv/quickstart",
		"/docs/arkenv/examples",
		"/docs/arkenv/coercion",
		"/docs/arkenv/validator-mode",
		"/docs/arkenv/integrations/ide/vscode",
		"/docs/arkenv/integrations/ide/jetbrains",
		"/docs/arkenv/how-to/load-environment-variables",
		"/docs/vite-plugin",
		"/docs/vite-plugin/arkenv-in-viteconfig",
	];

	for (const url of topRoutes) {
		test(`Route Smoke Test: ${url}`, async ({ page }) => {
			await page.goto(url);
			await page.waitForLoadState("networkidle");

			// 1. Basic Structure
			const main = page.locator("main").first();
			await expect(main).toBeVisible();
			const h1 = page.locator("h1").first();
			await expect(h1).toBeVisible();

			// 2. No Console Errors
			await assertNoConsoleErrors(page, url);

			// 3. A11y
			await assertNoA11yViolations(page);
		});
	}
});
