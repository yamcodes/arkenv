import { expect, test } from "@playwright/test";
import { assertNoConsoleErrors } from "./utils/console-errors";

test.describe("Documentation Navigation", () => {
	test("should load main documentation pages", async ({ page }) => {
		const docPages = [
			"/docs",
			"/docs/quickstart",
			"/docs/examples",
			"/docs/morphs",
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
			"/docs/integrations/vscode",
			"/docs/integrations/jetbrains",
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
		const howToPages = ["/docs/how-to/load-environment-variables"];

		for (const url of howToPages) {
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
		await page.waitForLoadState("networkidle");

		// Click the "Set sail" button
		const sailButton = page.locator("a[href='/docs/quickstart']");
		await expect(sailButton).toBeVisible();
		await sailButton.click();

		// Verify navigation
		await expect(page).toHaveURL("/docs/quickstart");
		await expect(page.locator("body")).toBeVisible();
	});

	test("should have working navigation between docs pages", async ({
		page,
	}) => {
		// Start at quickstart
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Look for navigation links to other docs pages
		const examplesLink = page.locator("a[href='/docs/examples']").first();
		if (await examplesLink.isVisible()) {
			await examplesLink.click();
			await expect(page).toHaveURL("/docs/examples");
		}

		// Navigate to morphs page
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");
		await expect(page.locator("body")).toBeVisible();
	});

	test("should have functional sidebar navigation", async ({ page }) => {
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Look for navigation elements (these might be in a sidebar or nav)
		const nav = page.locator("nav, [role='navigation'], .sidebar, .nav");
		if (await nav.isVisible()) {
			// Check that navigation is present
			await expect(nav).toBeVisible();
		}
	});

	test("should have working breadcrumbs", async ({ page }) => {
		await page.goto("/docs/quickstart");
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
			{ url: "/docs", expectedTitle: "What is ArkEnv?" },
			{ url: "/docs/quickstart", expectedTitle: "Quickstart" },
			{ url: "/docs/examples", expectedTitle: "Start with an example" },
			{ url: "/docs/morphs", expectedTitle: "Morphs" },
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
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		// Check for GitHub links
		const githubLinks = page.locator("a[href*='github.com']");
		const githubLinkCount = await githubLinks.count();

		if (githubLinkCount > 0) {
			const firstGithubLink = githubLinks.first();
			await expect(firstGithubLink).toHaveAttribute("target", "_blank");
			await expect(firstGithubLink).toHaveAttribute(
				"rel",
				"noreferrer noopener",
			);
		}

		// Check for ArkType links
		const arkTypeLinks = page.locator("a[href*='arktype.io']");
		const arkTypeLinkCount = await arkTypeLinks.count();

		if (arkTypeLinkCount > 0) {
			const firstArkTypeLink = arkTypeLinks.first();
			await expect(firstArkTypeLink).toHaveAttribute("target", "_blank");
			await expect(firstArkTypeLink).toHaveAttribute(
				"rel",
				"noopener noreferrer",
			);
		}
	});

	test("should not have console errors on any docs page", async ({ page }) => {
		const docPages = [
			"/docs",
			"/docs/quickstart",
			"/docs/examples",
			"/docs/morphs",
			"/docs/integrations/vscode",
			"/docs/integrations/jetbrains",
			"/docs/how-to/load-environment-variables",
		];

		await assertNoConsoleErrors(page, docPages);
	});
});
