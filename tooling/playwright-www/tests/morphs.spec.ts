import { expect, test } from "@playwright/test";

test.describe("Morphs/API Page", () => {
	test("should load morphs page", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check page title
		await expect(page.locator("h1")).toContainText("Morphs");

		// Check for the "New" icon/badge
		await expect(page.locator("text=New")).toBeVisible();
	});

	test("should display boolean morph documentation", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check for boolean section
		await expect(page.locator("text=boolean")).toBeVisible();

		// Check for boolean description
		await expect(page.locator("text=automatically morphs")).toBeVisible();
		await expect(page.locator("text=string values")).toBeVisible();
	});

	test("should display code examples", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check for code blocks
		const codeBlocks = page.locator("pre, code");
		await expect(codeBlocks.first()).toBeVisible();

		// Check for specific code examples
		await expect(page.locator("text=import arkenv")).toBeVisible();
		await expect(page.locator("text=const env = arkenv")).toBeVisible();
		await expect(page.locator('text=DEBUG: "boolean"')).toBeVisible();
	});

	test("should display boolean values explanation", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check for boolean values explanation
		await expect(page.locator('text="true"')).toBeVisible();
		await expect(page.locator('text="false"')).toBeVisible();
	});

	test("should display default values example", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check for default values example
		await expect(page.locator("text=boolean = false")).toBeVisible();
		await expect(page.locator("text=boolean = true")).toBeVisible();
	});

	test("should display custom morph example", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check for custom morph example
		await expect(page.locator("text=customize this behavior")).toBeVisible();
		await expect(
			page.locator("text=type(\"'true' | 'false' | '0' | '1'\")"),
		).toBeVisible();
	});

	test("should display command line examples", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check for command line examples
		await expect(page.locator("text=DEBUG=true")).toBeVisible();
		await expect(page.locator("text=DEBUG=false")).toBeVisible();
		await expect(page.locator("text=DEBUG=0")).toBeVisible();
		await expect(page.locator("text=DEBUG=1")).toBeVisible();
	});

	test("should have proper code syntax highlighting", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check that code blocks are present and have proper styling
		const codeBlocks = page.locator(
			"pre code, .language-ts, .language-typescript",
		);
		await expect(codeBlocks.first()).toBeVisible();
	});

	test("should display result examples", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check for result examples
		await expect(page.locator("text=Result:")).toBeVisible();
		await expect(page.locator("text=true")).toBeVisible();
		await expect(page.locator("text=false")).toBeVisible();
	});

	test("should have working external links", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check for any external links
		const externalLinks = page.locator(
			"a[href*='arktype.io'], a[href*='github.com']",
		);
		const linkCount = await externalLinks.count();

		if (linkCount > 0) {
			for (let i = 0; i < Math.min(linkCount, 3); i++) {
				const link = externalLinks.nth(i);
				await expect(link).toHaveAttribute("target", "_blank");
				await expect(link).toHaveAttribute("rel", "noopener noreferrer");
			}
		}
	});

	test("should have proper page structure", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check for main content area
		await expect(page.locator("main").first()).toBeVisible();

		// Check for heading hierarchy
		const h1 = page.locator("h1");
		await expect(h1).toBeVisible();

		const h2 = page.locator("h2");
		await expect(h2).toBeVisible();
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

		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1000);

		expect(consoleErrors).toHaveLength(0);
	});
});
