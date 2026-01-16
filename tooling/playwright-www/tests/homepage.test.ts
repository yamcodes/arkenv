import { expect, test } from "@playwright/test";

test.describe("Homepage Interactivity", () => {
	test("should have functional 'Quickstart' button", async ({ page }) => {
		await page.goto("/");
		const sailButton = page.locator("a[href='/docs/arkenv/quickstart']");
		await expect(sailButton).toBeVisible();

		await Promise.all([
			page.waitForURL("**/docs/arkenv/quickstart", { timeout: 30000 }),
			sailButton.click(),
		]);
		await expect(page).toHaveURL("/docs/arkenv/quickstart");
	});

	test("should have functional 'Star us on GitHub' button", async ({
		page,
	}) => {
		await page.goto("/");
		const githubLink = page
			.locator("a[href*='github.com']")
			.filter({ hasText: "Star" })
			.first();
		await expect(githubLink).toBeVisible();
		await expect(githubLink).toHaveAttribute("target", "_blank");
	});

	test("should have clickable video demo that opens StackBlitz", async ({
		page,
	}) => {
		await page.goto("/");
		const videoButton = page.locator(
			"button[aria-label='Open interactive demo in a new tab']",
		);
		await expect(videoButton).toBeVisible();

		const [newPage] = await Promise.all([
			page.context().waitForEvent("page", { timeout: 10000 }),
			videoButton.click(),
		]);

		await expect(newPage.url()).toContain("stackblitz.com");
		await newPage.close();
	});
});
