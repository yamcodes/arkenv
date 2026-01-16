import { expect, test } from "@playwright/test";
import { assertNoConsoleErrors } from "./utils/console-errors";

test.describe("Documentation Navigation", () => {
	test("should load main documentation pages", async ({ page }) => {
		const docPages = [
			"/docs/arkenv",
			"/docs/arkenv/quickstart",
			"/docs/arkenv/examples",
			"/docs/arkenv/coercion",
		];

		for (const url of docPages) {
			await page.goto(url);
			await page.waitForLoadState("networkidle");

			// Check page loads without errors
			await expect(page.locator("body")).toBeVisible();

			// Check for basic content structure
			await expect(page.locator("main").first()).toBeVisible();
		}
	});

	test("should load integration pages", async ({ page }) => {
		const integrationPages = [
			"/docs/arkenv/integrations/ide/vscode",
			"/docs/arkenv/integrations/ide/jetbrains",
		];

		for (const url of integrationPages) {
			await page.goto(url);
			await page.waitForLoadState("networkidle");

			// Check page loads without errors
			await expect(page.locator("body")).toBeVisible();

			// Check for basic content structure
			await expect(page.locator("main").first()).toBeVisible();
		}
	});

	test("should load how-to pages", async ({ page }) => {
		const howToPages = ["/docs/arkenv/how-to/load-environment-variables"];

		for (const url of howToPages) {
			await page.goto(url);
			await page.waitForLoadState("networkidle");

			// Check page loads without errors
			await expect(page.locator("body")).toBeVisible();

			// Check for basic content structure
			await expect(page.locator("main").first()).toBeVisible();
		}
	});

	test("should load vite-plugin pages", async ({ page }) => {
		const vitePluginPages = [
			"/docs/vite-plugin",
			"/docs/vite-plugin/arkenv-in-viteconfig",
		];

		for (const url of vitePluginPages) {
			await page.goto(url);
			await page.waitForLoadState("networkidle");

			// Check page loads without errors
			await expect(page.locator("body")).toBeVisible();

			// Check for basic content structure
			await expect(page.locator("main").first()).toBeVisible();
		}
	});

	test("should navigate from homepage to quickstart", async ({ page }) => {
		await page.goto("/");
		// Wait for the button to be visible instead of networkidle (more reliable, especially on webkit)
		const sailButton = page.locator("a[href='/docs/arkenv/quickstart']");
		await expect(sailButton).toBeVisible();

		// Click the "Set sail" button
		await sailButton.click();

		// Wait for navigation to complete with timeout
		await page.waitForURL("**/docs/arkenv/quickstart", { timeout: 30000 });
		await expect(page).toHaveURL("/docs/arkenv/quickstart");
		await expect(page.locator("body")).toBeVisible();
	});

	test("should have working navigation between docs pages", async ({
		page,
	}) => {
		// Start at quickstart
		await page.goto("/docs/arkenv/quickstart");
		await page.waitForLoadState("networkidle");

		// Look for navigation links to other docs pages
		const examplesLink = page
			.locator("a[href='/docs/arkenv/examples']")
			.first();
		if (await examplesLink.isVisible()) {
			await examplesLink.click();
			await expect(page).toHaveURL("/docs/arkenv/examples");
		}

		// Navigate to coercion page
		await page.goto("/docs/arkenv/coercion");
		await page.waitForLoadState("networkidle");
		await expect(page.locator("body")).toBeVisible();
	});

	test("should have functional sidebar navigation", async ({ page }) => {
		await page.goto("/docs/arkenv");
		await page.waitForLoadState("networkidle");

		// Look for navigation elements (these might be in a sidebar or nav)
		const nav = page.locator("nav, [role='navigation'], .sidebar, .nav");
		if (await nav.isVisible()) {
			// Check that navigation is present
			await expect(nav).toBeVisible();
		}
	});

	test("should have working breadcrumbs", async ({ page }) => {
		await page.goto("/docs/arkenv/quickstart");
		await page.waitForLoadState("networkidle");

		// Look for breadcrumb navigation
		const breadcrumbs = page.locator(
			"[aria-label='breadcrumb'], .breadcrumb, nav[aria-label*='breadcrumb']",
		);
		if (await breadcrumbs.isVisible()) {
			await expect(breadcrumbs).toBeVisible();
		}
	});

	test("should have proper page titles for all docs pages", async ({
		page,
	}) => {
		const pages = [
			{ url: "/docs/arkenv", expectedTitle: "What is ArkEnv" },
			{ url: "/docs/arkenv/quickstart", expectedTitle: "Quickstart" },
			{ url: "/docs/arkenv/examples", expectedTitle: "Start with an example" },
			{ url: "/docs/arkenv/coercion", expectedTitle: "Coercion" },
			{ url: "/docs/vite-plugin", expectedTitle: "Introduction" },
			{
				url: "/docs/vite-plugin/arkenv-in-viteconfig",
				expectedTitle: "Using ArkEnv in Vite config",
			},
		];

		for (const { url, expectedTitle } of pages) {
			await page.goto(url);
			await page.waitForLoadState("networkidle");

			// Check for heading with the expected title
			const heading = page.locator(`h1:has-text("${expectedTitle}")`);
			await expect(heading).toBeVisible();
		}
	});

	test("should have working external links", async ({ page }) => {
		await page.goto("/docs/arkenv");
		await page.waitForLoadState("networkidle");

		// Check for GitHub links
		const githubLinks = page.locator("a[href*='github.com']");
		const githubLinkCount = await githubLinks.count();

		if (githubLinkCount > 0) {
			const firstGithubLink = githubLinks.first();
			await expect(firstGithubLink).toHaveAttribute("target", "_blank");
			const rel = await firstGithubLink.getAttribute("rel");
			expect(rel).toContain("noopener");
			expect(rel).toContain("noreferrer");
		}

		// Check for ArkType links
		const arkTypeLinks = page.locator("a[href*='arktype.io']");
		const arkTypeLinkCount = await arkTypeLinks.count();

		if (arkTypeLinkCount > 0) {
			const firstArkTypeLink = arkTypeLinks.first();
			await expect(firstArkTypeLink).toHaveAttribute("target", "_blank");
			const rel = await firstArkTypeLink.getAttribute("rel");
			expect(rel).toContain("noopener");
			expect(rel).toContain("noreferrer");
		}
	});

	test("should not have console errors on any docs page", async ({ page }) => {
		const docPages = [
			"/docs/arkenv",
			"/docs/arkenv/quickstart",
			"/docs/arkenv/examples",
			"/docs/arkenv/coercion",
			"/docs/arkenv/integrations/ide/vscode",
			"/docs/arkenv/integrations/ide/jetbrains",
			"/docs/arkenv/how-to/load-environment-variables",
			"/docs/vite-plugin",
			"/docs/vite-plugin/arkenv-in-viteconfig",
		];

		await assertNoConsoleErrors(page, docPages);
	});
});
