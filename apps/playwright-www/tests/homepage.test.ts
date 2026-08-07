import { expect, test } from "@playwright/test";

test.describe("Homepage Interactivity", () => {
	test("should have functional 'Quickstart' button", async ({ page }) => {
		await page.goto("/");
		const sailButton = page.locator("a[href='/docs/getting-started']").first();
		await expect(sailButton).toBeVisible();

		await Promise.all([
			page.waitForURL("**/docs/getting-started", { timeout: 30000 }),
			sailButton.click(),
		]);
		await expect(page).toHaveURL("/docs/getting-started");
	});

	test("should have GitHub star link with correct security attributes", async ({
		page,
	}) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const githubLink = page.locator("a.home-aurora__nav-github");

		await expect(githubLink).toBeVisible();
		await expect(githubLink).toHaveAttribute("target", "_blank");
		const rel = await githubLink.getAttribute("rel");
		expect(rel).toContain("noopener");
		expect(rel).toContain("noreferrer");
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
