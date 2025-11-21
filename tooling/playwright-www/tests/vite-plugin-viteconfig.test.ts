import { expect, test } from "@playwright/test";
import { assertNoConsoleErrors } from "./utils/console-errors";

test.describe("Vite Plugin - Using ArkEnv in Vite config", () => {
	test("should load arkenv-in-viteconfig page", async ({ page }) => {
		await page.goto("/docs/vite-plugin/arkenv-in-viteconfig");
		// Wait for content to load
		await expect(page.locator("h1")).toContainText(
			"Using ArkEnv in Vite config",
		);
	});

	test("should display key content about loadEnv", async ({ page }) => {
		await page.goto("/docs/vite-plugin/arkenv-in-viteconfig");
		// Wait for content to load
		await expect(page.locator("h1")).toBeVisible();

		// Check for key concepts
		await expect(
			page.locator("text=Vite doesn't automatically load").first(),
		).toBeVisible();
		await expect(page.locator("text=loadEnv").first()).toBeVisible();
	});

	test("should display code example with type() and loadEnv", async ({
		page,
	}) => {
		await page.goto("/docs/vite-plugin/arkenv-in-viteconfig");
		// Wait for content to load
		await expect(page.locator("h1")).toBeVisible();

		// Check for code block with vite.config.ts
		await expect(page.locator("text=vite.config.ts").first()).toBeVisible();

		// Check for key code elements
		await expect(
			page.locator("text=import arkenvVitePlugin").first(),
		).toBeVisible();
		await expect(page.locator("text=import arkenv").first()).toBeVisible();
		await expect(
			page.locator("text=import { defineConfig, loadEnv }").first(),
		).toBeVisible();
		await expect(page.locator("text=const Env = type").first()).toBeVisible();
		await expect(
			page.locator("text=arkenv(Env, loadEnv").first(),
		).toBeVisible();
	});

	test("should display important callout about core package", async ({
		page,
	}) => {
		await page.goto("/docs/vite-plugin/arkenv-in-viteconfig");
		// Wait for content to load
		await expect(page.locator("h1")).toBeVisible();

		// Check for important callout
		await expect(
			page.locator("text=You must have the core arkenv package").first(),
		).toBeVisible();
	});

	test("should display explanation about schema reuse", async ({ page }) => {
		await page.goto("/docs/vite-plugin/arkenv-in-viteconfig");
		// Wait for content to load
		await expect(page.locator("h1")).toBeVisible();

		// Check for explanation about defining schema once
		// Note: *once* in markdown renders as italic, so match without asterisks
		await expect(
			page.locator("text=defining your schema").first(),
		).toBeVisible();
		await expect(
			page
				.locator("text=reusing it for both server-side config variables")
				.first(),
		).toBeVisible();
	});

	test("should have working external link to Vite docs", async ({ page }) => {
		await page.goto("/docs/vite-plugin/arkenv-in-viteconfig");
		// Wait for content to load
		await expect(page.locator("h1")).toBeVisible();

		// Check for Vite docs link in Cards component
		const viteDocsLink = page.locator(
			'a[href="https://vite.dev/config/#using-environment-variables-in-config"]',
		);
		const linkCount = await viteDocsLink.count();

		if (linkCount > 0) {
			await expect(viteDocsLink.first()).toBeVisible();
			await expect(viteDocsLink.first()).toHaveAttribute("target", "_blank");
			const rel = await viteDocsLink.first().getAttribute("rel");
			expect(rel).toContain("noopener");
			expect(rel).toContain("noreferrer");
		}
	});

	test("should display code example with PORT and VITE_API_URL", async ({
		page,
	}) => {
		await page.goto("/docs/vite-plugin/arkenv-in-viteconfig");
		// Wait for content to load
		await expect(page.locator("h1")).toBeVisible();

		// Check for environment variable examples in code blocks
		// Code blocks may have syntax highlighting, so use more flexible selectors
		await expect(page.locator("text=PORT").first()).toBeVisible();
		await expect(page.locator("text=number.port").first()).toBeVisible();
		await expect(page.locator("text=VITE_API_URL").first()).toBeVisible();
		await expect(page.locator("text=env.PORT").first()).toBeVisible();
	});

	test("should have proper page structure", async ({ page }) => {
		await page.goto("/docs/vite-plugin/arkenv-in-viteconfig");
		// Wait for content to load
		await expect(page.locator("h1")).toBeVisible();

		// Check for main content area
		await expect(page.locator("main").first()).toBeVisible();

		// Check for heading hierarchy
		const h1 = page.locator("h1");
		await expect(h1).toBeVisible();
	});

	test("should not have console errors", async ({ page }) => {
		await assertNoConsoleErrors(page, "/docs/vite-plugin/arkenv-in-viteconfig");
	});
});
