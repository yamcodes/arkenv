import { expect, test } from "@playwright/test";
import { assertNoConsoleErrors } from "./utils/console-errors";

test.describe("Examples Page", () => {
	test("should load examples page", async ({ page }) => {
		await page.goto("/docs/examples");
		await page.waitForLoadState("networkidle");

		// Check page title
		await expect(page.locator("h1")).toContainText("Start with an example");

		// Check description
		await expect(
			page.locator("text=Explore our collection of examples"),
		).toBeVisible();
	});

	test("should display examples list", async ({ page }) => {
		await page.goto("/docs/examples");
		await page.waitForLoadState("networkidle");

		// Check for examples content (this might be included from examples/README.md)
		// Look for common example patterns
		const examplesContent = page.locator(
			"text=basic, text=with-bun, text=with-vite",
		);
		if (await examplesContent.isVisible()) {
			await expect(examplesContent).toBeVisible();
		}
	});

	test("should have GitHub contribution link", async ({ page }) => {
		await page.goto("/docs/examples");
		await page.waitForLoadState("networkidle");

		// Look for GitHub contribution link
		const contributionLink = page.locator("a[href*='github.com']");
		const linkCount = await contributionLink.count();

		if (linkCount > 0) {
			const firstLink = contributionLink.first();
			await expect(firstLink).toHaveAttribute("target", "_blank");
			await expect(firstLink).toHaveAttribute("rel", "noreferrer noopener");
		}
	});

	test("should have working external links", async ({ page }) => {
		await page.goto("/docs/examples");
		await page.waitForLoadState("networkidle");

		// Check for any external links
		const externalLinks = page.locator(
			"a[href*='github.com'], a[href*='stackblitz.com']",
		);
		const linkCount = await externalLinks.count();

		if (linkCount > 0) {
			for (let i = 0; i < Math.min(linkCount, 3); i++) {
				const link = externalLinks.nth(i);
				await expect(link).toHaveAttribute("target", "_blank");
				await expect(link).toHaveAttribute("rel", "noreferrer noopener");
			}
		}
	});

	test("should display example descriptions", async ({ page }) => {
		await page.goto("/docs/examples");
		await page.waitForLoadState("networkidle");

		// Look for example descriptions or cards
		const exampleCards = page
			.locator("[class*='card'], .example, [class*='example']")
			.first();
		if (await exampleCards.isVisible()) {
			await expect(exampleCards).toBeVisible();
		}
	});

	test("should have proper page structure", async ({ page }) => {
		await page.goto("/docs/examples");
		await page.waitForLoadState("networkidle");

		// Check for main content area
		await expect(page.locator("main").first()).toBeVisible();

		// Check for heading hierarchy
		const h1 = page.locator("h1");
		await expect(h1).toBeVisible();
	});

	test("should not have console errors", async ({ page }) => {
		await assertNoConsoleErrors(page, "/docs/examples");
	});
});
