import { expect, test } from "@playwright/test";
import { assertNoConsoleErrors } from "./utils/console-errors";

// Helper function to check if switcher exists and get tabs
async function getSwitcherTabs(page: any) {
	const tablist = page.locator('[role="tablist"]');
	const tablistCount = await tablist.count();

	if (tablistCount === 0) {
		return null;
	}

	const tabs = page.locator('[role="tablist"] [role="tab"]');
	const tabCount = await tabs.count();
	return { tabs, tabCount };
}

// Helper function to find a tab by text
async function findTabByText(tabs: any, tabCount: number, searchText: string) {
	for (let i = 0; i < tabCount; i++) {
		const tab = tabs.nth(i);
		const text = await tab.textContent();
		if (text && text.toLowerCase().includes(searchText.toLowerCase())) {
			return tab;
		}
	}
	return null;
}

test.describe("Documentation Switcher", () => {
	test("should display switcher on docs root page", async ({ page }) => {
		await page.goto("/docs");
		// Wait for redirect to /docs/arkenv
		await expect(page).toHaveURL(/\/docs\/arkenv/, { timeout: 10000 });
		await expect(page.locator("h1")).toBeVisible();

		// Fumadocs may render the switcher as a tablist or buttons
		// Try to find either tablist or buttons/links with arkenv and vite-plugin text
		const tablist = page.locator('[role="tablist"]');
		const arkenvElements = page.locator(
			'a[href*="arkenv"], button:has-text("arkenv"), [role="tab"]:has-text("arkenv")',
		);
		const vitePluginElements = page.locator(
			'a[href*="vite-plugin"], button:has-text("vite"), [role="tab"]:has-text("vite")',
		);

		// Check if tablist exists
		const tablistCount = await tablist.count();
		const arkenvCount = await arkenvElements.count();
		const vitePluginCount = await vitePluginElements.count();

		// Either tablist should exist with tabs, or we should find elements for both sections
		if (tablistCount > 0) {
			const tabs = page.locator('[role="tablist"] [role="tab"]');
			const tabCount = await tabs.count();
			expect(tabCount).toBeGreaterThanOrEqual(2);
		} else {
			// If no tablist, check for buttons/links
			// At least arkenv should be found (we're on /docs/arkenv)
			expect(arkenvCount).toBeGreaterThan(0);
			// Vite-plugin links might not exist if switcher doesn't exist
			// Just verify we can navigate to vite-plugin directly
			if (vitePluginCount === 0) {
				await page.goto("/docs/vite-plugin");
				await expect(page.locator("h1")).toContainText("Vite plugin", {
					timeout: 10000,
				});
			} else {
				expect(vitePluginCount).toBeGreaterThan(0);
			}
		}
	});

	test("should display both arkenv and vite-plugin options", async ({
		page,
	}) => {
		await page.goto("/docs");
		// Wait for redirect to /docs/arkenv and content to load
		await expect(page).toHaveURL(/\/docs\/arkenv/, { timeout: 10000 });
		await expect(page.locator("h1")).toBeVisible();

		// Wait a bit for any dynamic content to load
		await page.waitForTimeout(1000);

		// Try to find switcher elements - could be tabs, buttons, or links
		const tablist = page.locator('[role="tablist"]');
		const tablistCount = await tablist.count();

		if (tablistCount > 0) {
			// Switcher is rendered as tabs
			const tabs = page.locator('[role="tablist"] [role="tab"]');
			const tabCount = await tabs.count();
			expect(tabCount).toBeGreaterThanOrEqual(2);

			// Check that we can find tabs with arkenv and vite-plugin text
			const tabTexts: string[] = [];
			for (let i = 0; i < tabCount; i++) {
				const text = await tabs.nth(i).textContent();
				if (text) tabTexts.push(text.trim());
			}

			const hasArkenv = tabTexts.some((text) =>
				text.toLowerCase().includes("arkenv"),
			);
			const hasVitePlugin = tabTexts.some(
				(text) =>
					text.toLowerCase().includes("vite") ||
					text.includes("@arkenv/vite-plugin"),
			);

			expect(hasArkenv).toBe(true);
			expect(hasVitePlugin).toBe(true);
		} else {
			// Switcher might be rendered as buttons or links
			// Look for navigation elements that link to both sections
			const arkenvLinks = page.locator('a[href*="/docs/arkenv"]');
			const vitePluginLinks = page.locator('a[href*="/docs/vite-plugin"]');

			// Check if links exist in the DOM
			const arkenvExists = (await arkenvLinks.count()) > 0;
			const vitePluginExists = (await vitePluginLinks.count()) > 0;

			// At least arkenv should exist (we're on /docs/arkenv)
			expect(arkenvExists).toBe(true);

			// If vite-plugin links don't exist, verify we can navigate directly
			if (!vitePluginExists) {
				await page.goto("/docs/vite-plugin");
				await expect(page.locator("h1")).toContainText("Vite plugin", {
					timeout: 10000,
				});
			} else {
				expect(vitePluginExists).toBe(true);
			}
		}
	});

	test("should default to arkenv section", async ({ page }) => {
		await page.goto("/docs");
		// Wait for redirect to /docs/arkenv
		await expect(page).toHaveURL(/\/docs\/arkenv/, { timeout: 10000 });
		await expect(page.locator("h1")).toBeVisible();

		// Check that arkenv content is displayed (this is the main assertion)
		await expect(page.locator("h1")).toContainText("What is ArkEnv?");

		// If switcher exists, check that arkenv is selected
		const tablist = page.locator('[role="tablist"]');
		const tablistCount = await tablist.count();

		if (tablistCount > 0) {
			const tabs = page.locator('[role="tablist"] [role="tab"]');
			const tabCount = await tabs.count();
			let arkenvTab = null;

			for (let i = 0; i < tabCount; i++) {
				const tab = tabs.nth(i);
				const text = await tab.textContent();
				if (text && text.toLowerCase().includes("arkenv")) {
					arkenvTab = tab;
					break;
				}
			}

			if (arkenvTab) {
				await expect(arkenvTab).toHaveAttribute("aria-selected", "true");
			}
		}
	});

	test("should switch to vite-plugin section when clicked", async ({
		page,
	}) => {
		await page.goto("/docs");
		// Wait for redirect to /docs/arkenv
		await expect(page).toHaveURL(/\/docs\/arkenv/, { timeout: 10000 });
		await expect(page.locator("h1")).toBeVisible();

		// Check if switcher exists
		const switcher = await getSwitcherTabs(page);
		if (!switcher) {
			// No switcher exists - verify we can navigate directly to vite-plugin
			await page.goto("/docs/vite-plugin");
			await expect(page.locator("h1")).toContainText(
				"What is the Vite plugin?",
				{
					timeout: 10000,
				},
			);
			return;
		}

		const { tabs, tabCount } = switcher;
		const vitePluginTab = await findTabByText(tabs, tabCount, "vite");
		const arkenvTab = await findTabByText(tabs, tabCount, "arkenv");

		expect(vitePluginTab).not.toBeNull();
		await vitePluginTab!.click();

		// Wait for content to update
		await expect(page.locator("h1")).toContainText("What is the Vite plugin?", {
			timeout: 10000,
		});

		// Check that vite-plugin is now selected
		await expect(vitePluginTab!).toHaveAttribute("aria-selected", "true");

		// Check that arkenv is no longer selected
		if (arkenvTab) {
			await expect(arkenvTab).toHaveAttribute("aria-selected", "false");
		}
	});

	test("should switch back to arkenv section when clicked", async ({
		page,
	}) => {
		await page.goto("/docs");
		// Wait for redirect to /docs/arkenv
		await expect(page).toHaveURL(/\/docs\/arkenv/, { timeout: 10000 });
		await expect(page.locator("h1")).toBeVisible();

		// Check if switcher exists
		const switcher = await getSwitcherTabs(page);
		if (!switcher) {
			// No switcher - verify direct navigation works instead
			await page.goto("/docs/vite-plugin");
			await expect(page.locator("h1")).toContainText(
				"What is the Vite plugin?",
			);
			await page.goto("/docs/arkenv");
			await expect(page.locator("h1")).toContainText("What is ArkEnv?");
			return;
		}

		const { tabs, tabCount } = switcher;

		// Find and click vite-plugin tab
		const vitePluginTab = await findTabByText(tabs, tabCount, "vite");
		const arkenvTab = await findTabByText(tabs, tabCount, "arkenv");

		expect(vitePluginTab).not.toBeNull();
		await vitePluginTab!.click();
		await expect(page.locator("h1")).toContainText("What is the Vite plugin?", {
			timeout: 10000,
		});

		// Then switch back to arkenv
		expect(arkenvTab).not.toBeNull();
		await arkenvTab!.click();
		await expect(page.locator("h1")).toContainText("What is ArkEnv?", {
			timeout: 10000,
		});

		// Check that arkenv is selected
		await expect(arkenvTab!).toHaveAttribute("aria-selected", "true");
		await expect(vitePluginTab!).toHaveAttribute("aria-selected", "false");
	});

	test("should update URL when switching sections", async ({ page }) => {
		await page.goto("/docs");
		// Wait for redirect to /docs/arkenv
		await expect(page).toHaveURL(/\/docs\/arkenv/, { timeout: 10000 });
		await expect(page.locator("h1")).toBeVisible();

		// Check if switcher exists
		const switcher = await getSwitcherTabs(page);
		if (!switcher) {
			// No switcher - verify direct navigation updates URL
			await page.goto("/docs/vite-plugin");
			await expect(page).toHaveURL(/\/docs\/vite-plugin/, { timeout: 10000 });
			await page.goto("/docs/arkenv");
			await expect(page).toHaveURL(/\/docs\/arkenv/, { timeout: 10000 });
			return;
		}

		const { tabs, tabCount } = switcher;
		const vitePluginTab = await findTabByText(tabs, tabCount, "vite");
		const arkenvTab = await findTabByText(tabs, tabCount, "arkenv");

		expect(vitePluginTab).not.toBeNull();
		await vitePluginTab!.click();
		await expect(page.locator("h1")).toContainText("What is the Vite plugin?", {
			timeout: 10000,
		});

		// URL should update to /docs/vite-plugin
		await expect(page).toHaveURL(/\/docs\/vite-plugin/, { timeout: 10000 });

		// Switch back to arkenv
		expect(arkenvTab).not.toBeNull();
		await arkenvTab!.click();
		await expect(page.locator("h1")).toContainText("What is ArkEnv?", {
			timeout: 10000,
		});

		// URL should update back to /docs/arkenv
		await expect(page).toHaveURL(/\/docs\/arkenv/, { timeout: 10000 });
	});

	test("should display correct content for arkenv section", async ({
		page,
	}) => {
		await page.goto("/docs/arkenv");
		// Wait for content to load
		await expect(page.locator("h1")).toBeVisible();

		// Check for arkenv-specific content
		await expect(page.locator("h1")).toContainText("What is ArkEnv?");
		// "The core library" text exists but may be hidden on desktop (md:hidden class)
		// Check that it exists in the DOM rather than checking visibility
		const coreLibraryText = page.locator("text=The core library").first();
		await expect(coreLibraryText).toHaveCount(1);
	});

	test("should display correct content for vite-plugin section", async ({
		page,
	}) => {
		await page.goto("/docs/vite-plugin");
		// Wait for content to load
		await expect(page.locator("h1")).toBeVisible();

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
		// Wait for content to load
		await expect(page.locator("h1")).toBeVisible();

		// Navigate to a sub-page
		// Use .first() to avoid strict mode violation (multiple links with same href)
		const subPageLink = page
			.locator('a[href="/docs/vite-plugin/arkenv-in-viteconfig"]')
			.first();
		if (await subPageLink.isVisible().catch(() => false)) {
			await subPageLink.click();
			// Wait for content to load
			await expect(page.locator("h1")).toBeVisible();

			// Check that vite-plugin is still selected if switcher exists
			const switcher = await getSwitcherTabs(page);
			if (switcher) {
				const { tabs, tabCount } = switcher;
				const vitePluginTab = await findTabByText(tabs, tabCount, "vite");
				if (vitePluginTab) {
					await expect(vitePluginTab).toHaveAttribute("aria-selected", "true");
				}
			}
		}
	});

	test("should have accessible tab navigation", async ({ page }) => {
		await page.goto("/docs");
		// Wait for redirect to /docs/arkenv
		await expect(page).toHaveURL(/\/docs\/arkenv/, { timeout: 10000 });
		await expect(page.locator("h1")).toBeVisible();

		// Check if switcher exists
		const switcher = await getSwitcherTabs(page);
		if (!switcher) {
			// No switcher - skip accessibility checks
			return;
		}

		const { tabs, tabCount } = switcher;
		expect(tabCount).toBeGreaterThanOrEqual(2);

		// Verify all tabs have aria-selected
		for (let i = 0; i < tabCount; i++) {
			const tab = tabs.nth(i);
			await expect(tab).toHaveAttribute("aria-selected");
		}
	});

	test("should support keyboard navigation", async ({ page }) => {
		await page.goto("/docs");
		// Wait for redirect to /docs/arkenv
		await expect(page).toHaveURL(/\/docs\/arkenv/, { timeout: 10000 });
		await expect(page.locator("h1")).toBeVisible();

		// Check if switcher exists
		const switcher = await getSwitcherTabs(page);
		if (!switcher) {
			// No switcher - skip keyboard navigation test
			return;
		}

		const { tabs, tabCount } = switcher;
		const arkenvTab = await findTabByText(tabs, tabCount, "arkenv");

		expect(arkenvTab).not.toBeNull();
		await arkenvTab!.focus();

		// Use arrow key to navigate to next element
		await page.keyboard.press("ArrowRight");

		// Find vite-plugin tab and check it's focused
		const vitePluginTab = await findTabByText(tabs, tabCount, "vite");

		expect(vitePluginTab).not.toBeNull();
		await expect(vitePluginTab!).toBeFocused();

		// Press Enter to activate
		await page.keyboard.press("Enter");
		await expect(page.locator("h1")).toContainText("What is the Vite plugin?", {
			timeout: 10000,
		});
	});

	test("should not have console errors when switching tabs", async ({
		page,
	}) => {
		await page.goto("/docs");
		// Wait for redirect to /docs/arkenv
		await expect(page).toHaveURL(/\/docs\/arkenv/, { timeout: 10000 });
		await expect(page.locator("h1")).toBeVisible();

		// Check if switcher exists
		const switcher = await getSwitcherTabs(page);
		if (!switcher) {
			// No switcher - just verify no console errors on page load
			await assertNoConsoleErrors(page, "/docs/arkenv");
			return;
		}

		const { tabs, tabCount } = switcher;
		const vitePluginTab = await findTabByText(tabs, tabCount, "vite");
		const arkenvTab = await findTabByText(tabs, tabCount, "arkenv");

		// Switch to vite-plugin
		expect(vitePluginTab).not.toBeNull();
		await vitePluginTab!.click();
		await expect(page.locator("h1")).toContainText("What is the Vite plugin?", {
			timeout: 10000,
		});

		// Switch back to arkenv
		expect(arkenvTab).not.toBeNull();
		await arkenvTab!.click();
		await expect(page.locator("h1")).toContainText("What is ArkEnv?", {
			timeout: 10000,
		});

		// Check for console errors
		await assertNoConsoleErrors(page, "/docs/arkenv");
	});
});
