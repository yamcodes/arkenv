import { expect, test } from "@playwright/test";
import { assertNoConsoleErrors } from "./utils/console-errors";

test("hello world - basic page load", async ({ page }) => {
	// Navigate to the homepage
	await page.goto("/");

	// Wait for the page to load
	await page.waitForLoadState("networkidle");

	// Check that the page title is not empty
	const title = await page.title();
	expect(title).toBeTruthy();

	// Check that the page has some content
	const body = await page.locator("body");
	await expect(body).toBeVisible();

	// Take a screenshot for visual verification
	await page.screenshot({ path: "tests/test-results/hello-world.png" });
});

test("hello world - check for basic HTML structure", async ({ page }) => {
	await page.goto("/", { timeout: 60000 });

	// Check that we have a proper HTML structure
	await expect(page.locator("html")).toBeVisible();
	await expect(page.locator("head")).toBeAttached();
	await expect(page.locator("body")).toBeVisible();

	await page.waitForLoadState("networkidle");
});

test("hello world - should not have console errors", async ({ page }) => {
	await assertNoConsoleErrors(page, "/");
});
