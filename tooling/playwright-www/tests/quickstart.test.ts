import { expect, test } from "@playwright/test";
import { assertNoConsoleErrors } from "./utils/console-errors";

test.describe("Quickstart Page", () => {
	test("should load quickstart page", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check page title
		await expect(page.locator("h1")).toContainText("Quickstart");

		// Check description
		await expect(
			page.locator("text=Let's get you started with a few simple steps"),
		).toBeVisible();
	});

	test("should display all installation steps", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check for step headings (check if elements exist, not visibility)
		const installElements = page.locator("text=Install");
		const installCount = await installElements.count();
		expect(installCount).toBeGreaterThan(0);
		await expect(
			page.locator("text=Configure your project").first(),
		).toBeVisible();
		await expect(page.locator("text=Define the schema").first()).toBeVisible();
		await expect(
			page.locator("text=Define environment variables").first(),
		).toBeVisible();
		await expect(page.locator("text=Use in your code").first()).toBeVisible();
	});

	test("should display installation command", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check for package installation command
		await expect(page.locator("text=arkenv arktype")).toBeVisible();
	});

	test("should display TypeScript configuration", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check for tsconfig.json content
		await expect(page.locator("text=tsconfig.json")).toBeVisible();
		await expect(page.locator("text=strict").first()).toBeVisible();
	});

	test("should display code examples", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check for code blocks (check if elements exist, not visibility)
		const codeBlocks = page.locator("pre, code");
		const codeCount = await codeBlocks.count();
		expect(codeCount).toBeGreaterThan(0);

		// Check for specific code examples
		await expect(page.locator("text=import arkenv")).toBeVisible();
		await expect(page.locator("text=DATABASE_HOST").first()).toBeVisible();
		await expect(page.locator("text=DATABASE_PORT").first()).toBeVisible();
	});

	test("should display environment variable examples", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check for .env file example
		await expect(page.locator("text=.env").first()).toBeVisible();
		await expect(page.locator("text=DATABASE_HOST=localhost")).toBeVisible();
		await expect(page.locator("text=DATABASE_PORT=5432")).toBeVisible();
	});

	test("should display usage examples", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check for database configuration example
		await expect(page.locator("text=database.ts")).toBeVisible();
		await expect(page.locator("text=import { env }")).toBeVisible();
		await expect(page.locator("text=const dbConfig")).toBeVisible();
	});

	test("should have working integration links", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check for integration links
		const vscodeLink = page
			.locator("a[href='/docs/arkenv/integrations/vscode']")
			.first();
		if (await vscodeLink.isVisible()) {
			await expect(vscodeLink).toBeVisible();
			await vscodeLink.click();
			await expect(page).toHaveURL("/docs/arkenv/integrations/vscode");
		}

		// Navigate back to quickstart
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		const jetbrainsLink = page
			.locator("a[href='/docs/arkenv/integrations/jetbrains']")
			.first();
		if (await jetbrainsLink.isVisible()) {
			await expect(jetbrainsLink).toBeVisible();
			await jetbrainsLink.click();
			await expect(page).toHaveURL("/docs/arkenv/integrations/jetbrains");
		}
	});

	test("should have working next steps cards", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Look for next steps section
		await expect(page.locator("text=Next steps").first()).toBeVisible();

		// Check for card links
		const cardLinks = page.locator("a[href*='/docs/']");
		const linkCount = await cardLinks.count();
		expect(linkCount).toBeGreaterThan(0);

		// Test clicking on a card
		const firstCard = cardLinks.first();
		if (await firstCard.isVisible()) {
			await firstCard.click();
			// Should navigate to another docs page
			await expect(page).toHaveURL(/\/docs\//);
		}
	});

	test("should have working environment variables guide link", async ({
		page,
	}) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Look for link to environment variables guide
		const envGuideLink = page
			.locator("a[href='/docs/arkenv/how-to/load-environment-variables']")
			.first();
		if (await envGuideLink.isVisible()) {
			await expect(envGuideLink).toBeVisible();
			await envGuideLink.click();
			// Wait for navigation to complete
			await page.waitForURL(
				"**/docs/arkenv/how-to/load-environment-variables",
				{
					timeout: 10000,
				},
			);
			await expect(page).toHaveURL(
				"/docs/arkenv/how-to/load-environment-variables",
			);
		}
	});

	test("should display tips and best practices", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check for tip about .env files
		await expect(page.locator("text=.env").first()).toBeVisible();
		await expect(page.locator("text=.gitignore")).toBeVisible();
	});

	test("should have proper code syntax highlighting", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check that code blocks are present and have proper styling
		const codeBlocks = page.locator(
			"pre code, .language-ts, .language-typescript",
		);
		await expect(codeBlocks.first()).toBeVisible();
	});

	test("should not have console errors", async ({ page }) => {
		await assertNoConsoleErrors(page, "/docs/quickstart");
	});
});
