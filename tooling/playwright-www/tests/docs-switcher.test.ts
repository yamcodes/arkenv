import { expect, test } from "@playwright/test";
import { assertNoConsoleErrors } from "./utils/console-errors";

test.describe("Documentation Switcher", () => {
	test("should display switcher on docs root page", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Check that the switcher/tabs component is present
		// Fumadocs creates a tablist for multiple root pages
		const tablist = page.locator('[role="tablist"]');
		await expect(tablist).toBeVisible();
	});

	test("should display both arkenv and vite-plugin options", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Check for both tab options
		// Tab text may be "arkenv" or "@arkenv/vite-plugin" depending on fumadocs rendering
		const arkenvTab = page.locator('[role="tab"]:has-text("arkenv")');
		const vitePluginTab = page.locator(
			'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin")',
		);

		await expect(arkenvTab).toBeVisible();
		await expect(vitePluginTab).toBeVisible();
	});

	test("should default to arkenv section", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Check that arkenv tab is selected by default
		const arkenvTab = page.locator('[role="tab"]:has-text("arkenv")');
		await expect(arkenvTab).toHaveAttribute("aria-selected", "true");

		// Check that arkenv content is displayed
		await expect(page.locator("h1")).toContainText("What is ArkEnv?");
	});

	test("should switch to vite-plugin section when clicked", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Click on vite-plugin tab (may be "@arkenv/vite-plugin" or "vite-plugin")
		const vitePluginTab = page.locator(
			'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin")',
		);
		await vitePluginTab.click();

		// Wait for content to update
		await page.waitForLoadState("networkidle");

		// Check that vite-plugin tab is now selected
		await expect(vitePluginTab).toHaveAttribute("aria-selected", "true");

		// Check that arkenv tab is no longer selected
		const arkenvTab = page.locator('[role="tab"]:has-text("arkenv")');
		await expect(arkenvTab).toHaveAttribute("aria-selected", "false");

		// Check that vite-plugin content is displayed
		await expect(page.locator("h1")).toContainText("What is the Vite plugin?");
	});

	test("should switch back to arkenv section when clicked", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// First switch to vite-plugin
		const vitePluginTab = page.locator(
			'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin")',
		);
		await vitePluginTab.click();
		await page.waitForLoadState("networkidle");

		// Then switch back to arkenv
		const arkenvTab = page.locator('[role="tab"]:has-text("arkenv")');
		await arkenvTab.click();
		await page.waitForLoadState("networkidle");

		// Check that arkenv tab is selected
		await expect(arkenvTab).toHaveAttribute("aria-selected", "true");

		// Check that vite-plugin tab is no longer selected
		await expect(vitePluginTab).toHaveAttribute("aria-selected", "false");

		// Check that arkenv content is displayed
		await expect(page.locator("h1")).toContainText("What is ArkEnv?");
	});

	test("should update URL when switching sections", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Initial URL should be /docs/arkenv (default)
		await expect(page).toHaveURL("/docs/arkenv");

		// Switch to vite-plugin
		const vitePluginTab = page.locator(
			'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin")',
		);
		await vitePluginTab.click();
		await page.waitForLoadState("networkidle");

		// URL should update to /docs/vite-plugin
		await expect(page).toHaveURL("/docs/vite-plugin");

		// Switch back to arkenv
		const arkenvTab = page.locator('[role="tab"]:has-text("arkenv")');
		await arkenvTab.click();
		await page.waitForLoadState("networkidle");

		// URL should update back to /docs/arkenv
		await expect(page).toHaveURL("/docs/arkenv");
	});

	test("should display correct content for arkenv section", async ({ page }) => {
		await page.goto("/docs/arkenv");
		await page.waitForLoadState("networkidle");

		// Check for arkenv-specific content
		await expect(page.locator("h1")).toContainText("What is ArkEnv?");
		await expect(
			page.locator("text=The core library").first(),
		).toBeVisible();
	});

	test("should display correct content for vite-plugin section", async ({
		page,
	}) => {
		await page.goto("/docs/vite-plugin");
		await page.waitForLoadState("networkidle");

		// Check for vite-plugin-specific content
		await expect(page.locator("h1")).toContainText("What is the Vite plugin?");
		await expect(
			page.locator("text=This is the Vite plugin for ArkEnv").first(),
		).toBeVisible();
	});

	test("should maintain selected tab when navigating to sub-pages", async ({
		page,
	}) => {
		// Start at vite-plugin section
		await page.goto("/docs/vite-plugin");
		await page.waitForLoadState("networkidle");

		// Navigate to a sub-page
		const subPageLink = page.locator(
			'a[href="/docs/vite-plugin/arkenv-in-viteconfig"]',
		);
		if (await subPageLink.isVisible()) {
			await subPageLink.click();
			await page.waitForLoadState("networkidle");

			// Check that vite-plugin tab is still selected
			const vitePluginTab = page.locator(
				'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin")',
			);
			await expect(vitePluginTab).toHaveAttribute("aria-selected", "true");
		}
	});

	test("should have accessible tab navigation", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Check that tabs have proper ARIA attributes
		const arkenvTab = page.locator('[role="tab"]:has-text("arkenv")');
		const vitePluginTab = page.locator(
			'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin")',
		);

		// Check aria-selected attribute
		await expect(arkenvTab).toHaveAttribute("aria-selected");
		await expect(vitePluginTab).toHaveAttribute("aria-selected");

		// Check that tablist has proper role
		const tablist = page.locator('[role="tablist"]');
		await expect(tablist).toBeVisible();
	});

	test("should support keyboard navigation", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Focus on the first tab (arkenv)
		const arkenvTab = page.locator('[role="tab"]:has-text("arkenv")');
		await arkenvTab.focus();

		// Use arrow key to navigate to next tab
		await page.keyboard.press("ArrowRight");

		// Check that vite-plugin tab is now focused
		const vitePluginTab = page.locator(
			'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin")',
		);
		await expect(vitePluginTab).toBeFocused();

		// Press Enter to activate
		await page.keyboard.press("Enter");
		await page.waitForLoadState("networkidle");

		// Check that vite-plugin content is displayed
		await expect(page.locator("h1")).toContainText("What is the Vite plugin?");
	});

	test("should not have console errors when switching tabs", async ({
		page,
	}) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Switch to vite-plugin
		const vitePluginTab = page.locator(
			'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin")',
		);
		await vitePluginTab.click();
		await page.waitForLoadState("networkidle");

		// Switch back to arkenv
		const arkenvTab = page.locator('[role="tab"]:has-text("arkenv")');
		await arkenvTab.click();
		await page.waitForLoadState("networkidle");

		// Check for console errors
		await assertNoConsoleErrors(page, "/docs");
	});
});

