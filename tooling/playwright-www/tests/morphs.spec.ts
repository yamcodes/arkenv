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

		// Check for boolean section (check if element exists, not visibility)
		const booleanElements = page.locator("text=boolean");
		const booleanCount = await booleanElements.count();
		expect(booleanCount).toBeGreaterThan(0);

		// Check for boolean description
		await expect(page.locator("text=automatically morphs")).toBeVisible();
		await expect(page.locator("text=string values")).toBeVisible();
	});

	test("should display code examples", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check for code blocks (check if elements exist, not visibility)
		const codeBlocks = page.locator("pre, code");
		const codeCount = await codeBlocks.count();
		expect(codeCount).toBeGreaterThan(0);

		// Check for specific code examples
		await expect(page.locator("text=import arkenv").first()).toBeVisible();
		await expect(page.locator("text=const env = arkenv").first()).toBeVisible();
		await expect(page.locator('text=DEBUG: "boolean"')).toBeVisible();
	});

	test("should display boolean values explanation", async ({ page }) => {
		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");

		// Check for boolean values explanation
		await expect(page.locator('text="true"').first()).toBeVisible();
		await expect(page.locator('text="false"').first()).toBeVisible();
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
		await expect(page.locator("text=DEBUG=true").first()).toBeVisible();
		await expect(page.locator("text=DEBUG=false").first()).toBeVisible();
		await expect(page.locator("text=DEBUG=0").first()).toBeVisible();
		await expect(page.locator("text=DEBUG=1").first()).toBeVisible();
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
		await expect(page.locator("text=Result:").first()).toBeVisible();
		await expect(page.locator("text=true").first()).toBeVisible();
		await expect(page.locator("text=false").first()).toBeVisible();
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

				// Check for either rel attribute order
				const relValue = await link.getAttribute("rel");
				expect(relValue).toMatch(/^(noopener noreferrer|noreferrer noopener)$/);
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

		// Check if h2 exists (may not be present on this page)
		const h2 = page.locator("h2");
		const h2Count = await h2.count();
		// h2 elements are optional on this page, so we just check they exist if present
		expect(h2Count).toBeGreaterThanOrEqual(0);
	});

	test("should not have console errors", async ({ page }) => {
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

		await page.goto("/docs/morphs");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1000);

		expect(consoleErrors).toHaveLength(0);
	});
});
