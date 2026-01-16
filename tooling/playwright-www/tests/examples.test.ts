import { expect, test } from "@playwright/test";

test.describe("Examples Page", () => {
	test("should have working external links", async ({ page }) => {
		await page.goto("/docs/arkenv/examples");
		await page.waitForLoadState("networkidle");

		// Verify external links have correct security attributes
		const externalLinks = page.locator(
			"a[href*='github.com'], a[href*='stackblitz.com']",
		);
		const linkCount = await externalLinks.count();

		if (linkCount > 0) {
			const firstLink = externalLinks.first();
			await expect(firstLink).toHaveAttribute("target", "_blank");
			const rel = await firstLink.getAttribute("rel");
			expect(rel).toContain("noopener");
			expect(rel).toContain("noreferrer");
		}
	});
});
