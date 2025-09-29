import { expect, test } from "@playwright/test";

test.describe("Global Features", () => {
	test("should have proper meta tags", async ({ page }) => {
		await page.goto("/");

		// Check basic meta tags
		await expect(page).toHaveTitle(/ArkEnv/);

		// Check for description meta tag
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toContain("ArkType");
	});

	test("should handle 404 pages gracefully", async ({ page }) => {
		// Navigate to a non-existent page
		const response = await page.goto("/non-existent-page");

		// Should return 404 status
		expect(response?.status()).toBe(404);

		// Page should still render something meaningful
		await expect(page.locator("body")).toBeVisible();
	});

	test("should have working theme toggle if present", async ({ page }) => {
		await page.goto("/");

		// Look for theme toggle button (common selectors)
		const themeToggle = page.locator(
			'button:has-text("theme"), button[aria-label*="theme" i], [data-theme-toggle]',
		);

		if ((await themeToggle.count()) > 0) {
			await expect(themeToggle.first()).toBeVisible();

			// Try clicking the theme toggle
			await themeToggle.first().click();

			// Wait a bit for theme to change
			await page.waitForTimeout(100);
		}
	});

	test("should load without JavaScript errors", async ({ page }) => {
		const errors: string[] = [];

		// Listen for console errors
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				errors.push(msg.text());
			}
		});

		await page.goto("/");

		// Wait for page to fully load
		await page.waitForLoadState("networkidle");

		// Check for any JavaScript errors
		expect(errors.length).toBe(0);
	});

	test("should have proper accessibility features", async ({ page }) => {
		await page.goto("/");

		// Check for proper heading hierarchy
		const h1 = page.locator("h1");
		await expect(h1).toHaveCount(1);

		// Check that interactive elements are keyboard accessible
		const links = page.locator("a[href]");
		const firstLink = links.first();

		if ((await firstLink.count()) > 0) {
			await firstLink.focus();
			await expect(firstLink).toBeFocused();
		}
	});

	test("should have banner functionality", async ({ page }) => {
		await page.goto("/");

		// Check for the rainbow banner mentioning arktype.io
		const banner = page.getByText("We are now featured on");
		await expect(banner).toBeVisible();

		// Check that the arktype.io link in banner works
		const arkTypeBannerLink = page.getByRole("link", { name: "arktype.io" });
		await expect(arkTypeBannerLink).toBeVisible();
		await expect(arkTypeBannerLink).toHaveAttribute(
			"href",
			"https://arktype.io/docs/ecosystem#arkenv",
		);
	});
});
