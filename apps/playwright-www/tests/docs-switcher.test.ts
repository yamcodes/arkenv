import { expect, test } from "@playwright/test";

test.describe("Documentation sections", () => {
	test("should navigate between Getting started and Guides", async ({
		page,
	}) => {
		await page.goto("/docs/getting-started");
		await page.waitForLoadState("networkidle");

		await expect(page.locator("h1").first()).toBeVisible();
		await expect(page).toHaveURL(/\/docs\/getting-started\/?$/);

		await page.goto("/docs/guides");
		await page.waitForLoadState("networkidle");

		await expect(page.locator("h1").first()).toBeVisible();
		await expect(page).toHaveURL(/\/docs\/guides\/?$/);
	});

	test("should drill into a Nested Folder page", async ({ page }) => {
		await page.goto("/docs/guides/frameworks/nextjs");
		await page.waitForLoadState("networkidle");

		await expect(page.locator("h1").first()).toBeVisible();
		await expect(page).toHaveURL(/\/docs\/guides\/frameworks\/nextjs\/?$/);
	});
});
