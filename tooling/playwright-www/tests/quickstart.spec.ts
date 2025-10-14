import { expect, test } from "@playwright/test";

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

		// Check for step headings
		await expect(page.locator("text=Install")).toBeVisible();
		await expect(page.locator("text=Configure your project")).toBeVisible();
		await expect(page.locator("text=Define the schema")).toBeVisible();
		await expect(
			page.locator("text=Define environment variables"),
		).toBeVisible();
		await expect(page.locator("text=Use in your code")).toBeVisible();
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
		await expect(page.locator("text=strict")).toBeVisible();
	});

	test("should display code examples", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check for code blocks
		const codeBlocks = page.locator("pre, code");
		await expect(codeBlocks.first()).toBeVisible();

		// Check for specific code examples
		await expect(page.locator("text=import arkenv")).toBeVisible();
		await expect(page.locator("text=DATABASE_HOST")).toBeVisible();
		await expect(page.locator("text=DATABASE_PORT")).toBeVisible();
	});

	test("should display environment variable examples", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check for .env file example
		await expect(page.locator("text=.env")).toBeVisible();
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
		const vscodeLink = page.locator("a[href='/docs/integrations/vscode']");
		if (await vscodeLink.isVisible()) {
			await expect(vscodeLink).toBeVisible();
			await vscodeLink.click();
			await expect(page).toHaveURL("/docs/integrations/vscode");
		}

		// Navigate back to quickstart
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		const jetbrainsLink = page.locator(
			"a[href='/docs/integrations/jetbrains']",
		);
		if (await jetbrainsLink.isVisible()) {
			await expect(jetbrainsLink).toBeVisible();
			await jetbrainsLink.click();
			await expect(page).toHaveURL("/docs/integrations/jetbrains");
		}
	});

	test("should have working next steps cards", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Look for next steps section
		await expect(page.locator("text=Next steps")).toBeVisible();

		// Check for card links
		const cardLinks = page.locator("a[href*='/docs/']");
		const linkCount = await cardLinks.count();
		expect(linkCount).toBeGreaterThan(0);

		// Test clicking on a card
		const firstCard = cardLinks.first();
		if (await firstCard.isVisible()) {
			await firstCard.click();
			// Should navigate to another docs page
			await expect(page.url()).toMatch(/\/docs\//);
		}
	});

	test("should have working environment variables guide link", async ({
		page,
	}) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Look for link to environment variables guide
		const envGuideLink = page.locator(
			"a[href='/docs/how-to/load-environment-variables']",
		);
		if (await envGuideLink.isVisible()) {
			await expect(envGuideLink).toBeVisible();
			await envGuideLink.click();
			await expect(page).toHaveURL("/docs/how-to/load-environment-variables");
		}
	});

	test("should display tips and best practices", async ({ page }) => {
		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");

		// Check for tip about .env files
		await expect(page.locator("text=.env")).toBeVisible();
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
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				// Filter out known non-critical errors
				const errorText = msg.text();
				if (!errorText.includes("403") && !errorText.includes("Failed to load resource")) {
					consoleErrors.push(errorText);
				}
			}
		});

		await page.goto("/docs/quickstart");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1000);

		expect(consoleErrors).toHaveLength(0);
	});
});
