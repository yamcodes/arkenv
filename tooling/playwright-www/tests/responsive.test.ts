import { expect, test } from "@playwright/test";

test.describe("Responsive Design", () => {
	const mobileViewports = [
		{ name: "iPhone SE", width: 375, height: 667 },
		{ name: "Small Mobile", width: 320, height: 568 },
	];

	for (const viewport of mobileViewports) {
		test(`should not have horizontal overflow on ${viewport.name}`, async ({
			page,
		}) => {
			await page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			});

			await page.goto("/");
			await page.waitForLoadState("networkidle");

			// Check that body width doesn't exceed viewport width (no horizontal scroll)
			const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
			const viewportWidth = viewport.width;

			expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
		});
	}
});
