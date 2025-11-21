import { expect, test } from "@playwright/test";
import { assertNoConsoleErrors } from "./utils/console-errors";

test.describe("Documentation Switcher", () => {
	test("should display switcher on docs root page", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Fumadocs may render the switcher as tabs or buttons
		// Check for either tablist or button-based switcher
		const tablist = page.locator('[role="tablist"]');
		const switcherButtons = page.locator(
			'button:has-text("arkenv"), button:has-text("vite-plugin"), button:has-text("@arkenv/vite-plugin")',
		);

		// At least one form of switcher should be present
		const tablistCount = await tablist.count();
		const buttonCount = await switcherButtons.count();

		expect(tablistCount + buttonCount).toBeGreaterThan(0);
	});

	test("should display both arkenv and vite-plugin options", async ({
		page,
	}) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Check for both options - may be tabs or buttons
		// Tab text may be "arkenv" or "@arkenv/vite-plugin" depending on fumadocs rendering
		const arkenvTab = page.locator(
			'[role="tab"]:has-text("arkenv"), button:has-text("arkenv")',
		);
		const vitePluginTab = page.locator(
			'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin"), button:has-text("@arkenv/vite-plugin"), button:has-text("vite-plugin")',
		);

		await expect(arkenvTab.first()).toBeVisible();
		await expect(vitePluginTab.first()).toBeVisible();
	});

	test("should default to arkenv section", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Check that arkenv is selected by default (may be tab or button)
		const arkenvTab = page
			.locator('[role="tab"]:has-text("arkenv"), button:has-text("arkenv")')
			.first();

		// Check if it's a tab with aria-selected, or verify by content
		const isTab = (await arkenvTab.getAttribute("role")) === "tab";
		if (isTab) {
			await expect(arkenvTab).toHaveAttribute("aria-selected", "true");
		}

		// Check that arkenv content is displayed
		await expect(page.locator("h1")).toContainText("What is ArkEnv?");
	});

	test("should switch to vite-plugin section when clicked", async ({
		page,
	}) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Click on vite-plugin (may be tab or button, "@arkenv/vite-plugin" or "vite-plugin")
		const vitePluginTab = page
			.locator(
				'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin"), button:has-text("@arkenv/vite-plugin"), button:has-text("vite-plugin")',
			)
			.first();
		await vitePluginTab.click();

		// Wait for content to update
		await page.waitForLoadState("networkidle");

		// Check that vite-plugin is now selected (if it's a tab)
		const isTab = (await vitePluginTab.getAttribute("role")) === "tab";
		if (isTab) {
			await expect(vitePluginTab).toHaveAttribute("aria-selected", "true");
		}

		// Check that arkenv is no longer selected (if it's a tab)
		const arkenvTab = page
			.locator('[role="tab"]:has-text("arkenv"), button:has-text("arkenv")')
			.first();
		if ((await arkenvTab.getAttribute("role")) === "tab") {
			await expect(arkenvTab).toHaveAttribute("aria-selected", "false");
		}

		// Check that vite-plugin content is displayed
		await expect(page.locator("h1")).toContainText("What is the Vite plugin?");
	});

	test("should switch back to arkenv section when clicked", async ({
		page,
	}) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// First switch to vite-plugin
		const vitePluginTab = page
			.locator(
				'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin"), button:has-text("@arkenv/vite-plugin"), button:has-text("vite-plugin")',
			)
			.first();
		await vitePluginTab.click();
		await page.waitForLoadState("networkidle");

		// Then switch back to arkenv
		const arkenvTab = page
			.locator('[role="tab"]:has-text("arkenv"), button:has-text("arkenv")')
			.first();
		await arkenvTab.click();
		await page.waitForLoadState("networkidle");

		// Check that arkenv is selected (if it's a tab)
		if ((await arkenvTab.getAttribute("role")) === "tab") {
			await expect(arkenvTab).toHaveAttribute("aria-selected", "true");
		}

		// Check that vite-plugin is no longer selected (if it's a tab)
		if ((await vitePluginTab.getAttribute("role")) === "tab") {
			await expect(vitePluginTab).toHaveAttribute("aria-selected", "false");
		}

		// Check that arkenv content is displayed
		await expect(page.locator("h1")).toContainText("What is ArkEnv?");
	});

	test("should update URL when switching sections", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Initial URL should be /docs/arkenv (default)
		await expect(page).toHaveURL("/docs/arkenv");

		// Switch to vite-plugin
		const vitePluginTab = page
			.locator(
				'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin"), button:has-text("@arkenv/vite-plugin"), button:has-text("vite-plugin")',
			)
			.first();
		await vitePluginTab.click();
		await page.waitForLoadState("networkidle");

		// URL should update to /docs/vite-plugin
		await expect(page).toHaveURL("/docs/vite-plugin");

		// Switch back to arkenv
		const arkenvTab = page
			.locator('[role="tab"]:has-text("arkenv"), button:has-text("arkenv")')
			.first();
		await arkenvTab.click();
		await page.waitForLoadState("networkidle");

		// URL should update back to /docs/arkenv
		await expect(page).toHaveURL("/docs/arkenv");
	});

	test("should display correct content for arkenv section", async ({
		page,
	}) => {
		await page.goto("/docs/arkenv");
		await page.waitForLoadState("networkidle");

		// Check for arkenv-specific content
		await expect(page.locator("h1")).toContainText("What is ArkEnv?");
		await expect(page.locator("text=The core library").first()).toBeVisible();
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

			// Check that vite-plugin is still selected (if it's a tab)
			const vitePluginTab = page
				.locator(
					'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin"), button:has-text("@arkenv/vite-plugin"), button:has-text("vite-plugin")',
				)
				.first();
			if ((await vitePluginTab.getAttribute("role")) === "tab") {
				await expect(vitePluginTab).toHaveAttribute("aria-selected", "true");
			}
		}
	});

	test("should have accessible tab navigation", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Check that switcher elements exist (may be tabs or buttons)
		const arkenvTab = page
			.locator('[role="tab"]:has-text("arkenv"), button:has-text("arkenv")')
			.first();
		const vitePluginTab = page
			.locator(
				'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin"), button:has-text("@arkenv/vite-plugin"), button:has-text("vite-plugin")',
			)
			.first();

		// Check aria-selected attribute if they're tabs
		const arkenvRole = await arkenvTab.getAttribute("role");
		const vitePluginRole = await vitePluginTab.getAttribute("role");

		if (arkenvRole === "tab") {
			await expect(arkenvTab).toHaveAttribute("aria-selected");
		}
		if (vitePluginRole === "tab") {
			await expect(vitePluginTab).toHaveAttribute("aria-selected");
		}

		// Check that tablist exists if tabs are used, otherwise verify buttons exist
		const tablist = page.locator('[role="tablist"]');
		const tablistCount = await tablist.count();
		if (tablistCount === 0) {
			// If no tablist, verify buttons exist as alternative
			const arkenvButtons = page.locator('button:has-text("arkenv")');
			const vitePluginButtons = page.locator(
				'button:has-text("@arkenv/vite-plugin"), button:has-text("vite-plugin")',
			);
			expect(await arkenvButtons.count()).toBeGreaterThan(0);
			expect(await vitePluginButtons.count()).toBeGreaterThan(0);
		} else {
			await expect(tablist).toBeVisible();
		}
	});

	test("should support keyboard navigation", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Focus on the first switcher element (arkenv) - may be tab or button
		const arkenvTab = page
			.locator('[role="tab"]:has-text("arkenv"), button:has-text("arkenv")')
			.first();
		await arkenvTab.focus();

		// Use arrow key to navigate to next element (if tabs) or Tab (if buttons)
		const isTab = (await arkenvTab.getAttribute("role")) === "tab";
		if (isTab) {
			await page.keyboard.press("ArrowRight");
		} else {
			await page.keyboard.press("Tab");
		}

		// Check that vite-plugin element is now focused
		const vitePluginTab = page
			.locator(
				'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin"), button:has-text("@arkenv/vite-plugin"), button:has-text("vite-plugin")',
			)
			.first();
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
		const vitePluginTab = page
			.locator(
				'[role="tab"]:has-text("@arkenv/vite-plugin"), [role="tab"]:has-text("vite-plugin"), button:has-text("@arkenv/vite-plugin"), button:has-text("vite-plugin")',
			)
			.first();
		await vitePluginTab.click();
		await page.waitForLoadState("networkidle");

		// Switch back to arkenv
		const arkenvTab = page
			.locator('[role="tab"]:has-text("arkenv"), button:has-text("arkenv")')
			.first();
		await arkenvTab.click();
		await page.waitForLoadState("networkidle");

		// Check for console errors
		await assertNoConsoleErrors(page, "/docs");
	});
});
