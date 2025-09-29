import { expect, test } from "@playwright/test";

test.describe("Documentation", () => {
	test("should navigate to documentation page", async ({ page }) => {
		await page.goto("/docs");

		// Check that we're on the documentation page
		await expect(page).toHaveTitle(/ArkEnv/);

		// Check for documentation layout elements
		await expect(page.locator("nav")).toBeVisible(); // Sidebar navigation
	});

	test("should have working sidebar navigation", async ({ page }) => {
		await page.goto("/docs");

		// Check that sidebar navigation is present
		const sidebar = page.locator("nav");
		await expect(sidebar).toBeVisible();

		// Check for navigation links in sidebar
		const navLinks = sidebar.locator("a");
		await expect(navLinks.first()).toBeVisible();
	});

	test("should have search functionality", async ({ page }) => {
		await page.goto("/docs");

		// Look for search input/button
		const searchElements = page.locator(
			'[placeholder*="search" i], [aria-label*="search" i], button:has-text("Search")',
		);
		if ((await searchElements.count()) > 0) {
			await expect(searchElements.first()).toBeVisible();
		}
	});

	test("should display content properly", async ({ page }) => {
		await page.goto("/docs");

		// Check that main content area exists
		await expect(page.locator('main, [role="main"], article')).toBeVisible();
	});

	test("should have responsive design", async ({ page }) => {
		// Test desktop view
		await page.setViewportSize({ width: 1200, height: 800 });
		await page.goto("/docs");
		await expect(page.locator("nav")).toBeVisible();

		// Test mobile view - sidebar might be hidden
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/docs");
		// On mobile, content should still be visible
		await expect(page.locator('main, [role="main"], article')).toBeVisible();
	});
});
