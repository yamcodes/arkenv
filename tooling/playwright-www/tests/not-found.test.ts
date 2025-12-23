import { expect, test } from "@playwright/test";

test.describe("Not Found (404) Page", () => {
	test("should render custom 404 page for non-existent routes", async ({
		page,
	}) => {
		await page.goto("/this-page-definitely-does-not-exist");

		// 1. Verify basic page structure (landmark exists)
		const main = page.locator("main").first();
		await expect(main).toBeVisible();

		// 2. Verify basic content (not too specific)
		await expect(page.locator("h1")).toContainText(/not found/i);

		// 3. Verify standard links are present (at least the Home link)
		const homeLink = page.locator("a[href='/']").first();
		await expect(homeLink).toBeVisible();
		await expect(homeLink).toHaveText(/Home/i);
	});

	test("should allow navigating back Home from 404 page", async ({ page }) => {
		await page.goto("/404-test-random-route");

		const homeLink = page.locator("a[href='/']").first();
		await homeLink.click();

		await expect(page).toHaveURL("/");
		await expect(page.locator("h1")).toBeVisible();
	});
});
