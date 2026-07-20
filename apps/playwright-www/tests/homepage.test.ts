import { expect, test } from "@playwright/test";

test.describe("Homepage Interactivity", () => {
	test("should have functional docs link", async ({ page }) => {
		await page.goto("/");
		const docsLink = page.locator("a[href='/docs/arkenv']").first();
		await expect(docsLink).toBeVisible();

		await Promise.all([
			page.waitForURL("**/docs/arkenv", { timeout: 30000 }),
			docsLink.click(),
		]);
		await expect(page).toHaveURL("/docs/arkenv");
	});

	test("should have GitHub link with correct security attributes", async ({
		page,
	}) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Header has desktop + menu GitHub actions; assert the first visible one.
		const githubLink = page
			.getByRole("link", { name: "GitHub", exact: true })
			.first();

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
