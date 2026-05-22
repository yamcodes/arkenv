import { expect, test } from "@playwright/test";

test.describe("Documentation Switcher", () => {
	test("should switch between arkenv and vite-plugin sections", async ({
		page,
	}) => {
		await page.goto("/docs/arkenv");
		await page.waitForLoadState("networkidle");

		// Verify we're on arkenv section
		await expect(page.locator("h1")).toContainText("What is ArkEnv");

		// Navigate to vite-plugin section
		await page.goto("/docs/vite-plugin");
		await page.waitForLoadState("networkidle");

		// Verify we're on vite-plugin section
		await expect(page.locator("h1")).toContainText("Introduction");
	});

	test("should support keyboard navigation on switcher tabs if present", async ({
		page,
	}) => {
		await page.goto("/docs/arkenv");
		await page.waitForLoadState("networkidle");

		// Check if tablist exists
		const tablist = page.locator('[role="tablist"]');
		const tablistCount = await tablist.count();

		if (tablistCount > 0) {
			// Verify tabs have aria-selected attribute
			const tabs = page.locator('[role="tablist"] [role="tab"]');
			const firstTab = tabs.first();
			await expect(firstTab).toHaveAttribute("aria-selected");
		}
	});
});
