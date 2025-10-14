import { expect, test } from "@playwright/test";

test.describe("Integration Pages", () => {
	test("should load VS Code integration page", async ({ page }) => {
		await page.goto("/docs/integrations/vscode");
		await page.waitForLoadState("networkidle");

		// Check page title
		await expect(page.locator("h1")).toContainText(
			"Integrate with VS Code & Cursor",
		);

		// Check for main content
		await expect(page.locator("main").first()).toBeVisible();
	});

	test("should have VS Code marketplace links", async ({ page }) => {
		await page.goto("/docs/integrations/vscode");
		await page.waitForLoadState("networkidle");

		// Check for marketplace links
		const marketplaceLinks = page.locator(
			"a[href*='marketplace.visualstudio.com']",
		);
		await expect(marketplaceLinks.first()).toBeVisible();

		// Check for ArkType extension link
		const arkTypeLink = page.locator("a[href*='arktypeio.arkdark']").first();
		await expect(arkTypeLink).toBeVisible();
		await expect(arkTypeLink).toHaveAttribute("target", "_blank");
		await expect(arkTypeLink).toHaveAttribute("rel", "noreferrer noopener");

		// Check for ArkThemes link
		const arkThemesLink = page
			.locator("a[href*='arktypeio.arkthemes']")
			.first();
		await expect(arkThemesLink).toBeVisible();
		await expect(arkThemesLink).toHaveAttribute("target", "_blank");
		await expect(arkThemesLink).toHaveAttribute("rel", "noreferrer noopener");
	});

	test("should display VS Code extension descriptions", async ({ page }) => {
		await page.goto("/docs/integrations/vscode");
		await page.waitForLoadState("networkidle");

		// Check for extension descriptions
		await expect(
			page.locator("text=Syntax highlighting").first(),
		).toBeVisible();
		await expect(page.locator("text=inline error detection")).toBeVisible();
		await expect(page.locator("text=ArkType extension")).toBeVisible();
	});

	test("should have working card links", async ({ page }) => {
		await page.goto("/docs/integrations/vscode");
		await page.waitForLoadState("networkidle");

		// Check for card links
		const cardLinks = page.locator("a[href*='marketplace.visualstudio.com']");
		const linkCount = await cardLinks.count();

		expect(linkCount).toBeGreaterThan(0);

		// Test clicking on first card
		const firstCard = cardLinks.first();
		await expect(firstCard).toBeVisible();
		await expect(firstCard).toHaveAttribute("target", "_blank");
	});

	test("should load JetBrains integration page", async ({ page }) => {
		await page.goto("/docs/integrations/jetbrains");
		await page.waitForLoadState("networkidle");

		// Check page title
		await expect(page.locator("h1")).toContainText("JetBrains");

		// Check for main content
		await expect(page.locator("main").first()).toBeVisible();
	});

	test("should have JetBrains marketplace links", async ({ page }) => {
		await page.goto("/docs/integrations/jetbrains");
		await page.waitForLoadState("networkidle");

		// Check for marketplace links (JetBrains might use different marketplace)
		const marketplaceLinks = page.locator(
			"a[href*='marketplace'], a[href*='plugins.jetbrains.com']",
		);
		const linkCount = await marketplaceLinks.count();

		if (linkCount > 0) {
			const firstLink = marketplaceLinks.first();
			await expect(firstLink).toHaveAttribute("target", "_blank");
			await expect(firstLink).toHaveAttribute("rel", "noreferrer noopener");
		}
	});

	test("should display JetBrains extension descriptions", async ({ page }) => {
		await page.goto("/docs/integrations/jetbrains");
		await page.waitForLoadState("networkidle");

		// Check for extension descriptions
		await expect(
			page.locator("text=syntax highlighting").first(),
		).toBeVisible();
		await expect(page.locator("text=JetBrains").first()).toBeVisible();
	});

	test("should have proper page structure for both integration pages", async ({
		page,
	}) => {
		const pages = ["/docs/integrations/vscode", "/docs/integrations/jetbrains"];

		for (const url of pages) {
			await page.goto(url);
			await page.waitForLoadState("networkidle");

			// Check for main content area
			await expect(page.locator("main").first()).toBeVisible();

			// Check for heading hierarchy
			const h1 = page.locator("h1");
			await expect(h1).toBeVisible();
		}
	});

	test("should have working external links on both pages", async ({ page }) => {
		const pages = ["/docs/integrations/vscode", "/docs/integrations/jetbrains"];

		for (const url of pages) {
			await page.goto(url);
			await page.waitForLoadState("networkidle");

			// Check for external links
			const externalLinks = page.locator(
				"a[href*='marketplace'], a[href*='plugins.jetbrains.com'], a[href*='visualstudio.com']",
			);
			const linkCount = await externalLinks.count();

			if (linkCount > 0) {
				for (let i = 0; i < Math.min(linkCount, 3); i++) {
					const link = externalLinks.nth(i);
					await expect(link).toHaveAttribute("target", "_blank");
					await expect(link).toHaveAttribute("rel", "noreferrer noopener");
				}
			}
		}
	});

	test("should not have console errors on integration pages", async ({
		page,
	}) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				// Filter out known non-critical errors
				const errorText = msg.text();
				if (
					!errorText.includes("403") &&
					!errorText.includes("Failed to load resource")
				) {
					consoleErrors.push(errorText);
				}
			}
		});

		const pages = ["/docs/integrations/vscode", "/docs/integrations/jetbrains"];

		for (const url of pages) {
			await page.goto(url);
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(500);
		}

		expect(consoleErrors).toHaveLength(0);
	});
});
