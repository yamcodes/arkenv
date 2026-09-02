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

	test("automatic coercion showcase adapts layout between mobile and desktop", async ({
		page,
	}) => {
		// Mobile viewport (375px) — direct single wire visible, desktop gate and split wires hidden
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const directWireMobile = page.locator(
			".home-aurora__payload-row--port .home-aurora__payload-wire--direct",
		);
		const gateMobile = page.locator(
			".home-aurora__payload-row--port .home-aurora__payload-gate",
		);
		const wire1Mobile = page.locator(
			".home-aurora__payload-row--port .home-aurora__payload-wire--1",
		);

		await expect(directWireMobile).toHaveCSS("display", "flex");
		await expect(gateMobile).toHaveCSS("display", "none");
		await expect(wire1Mobile).toHaveCSS("display", "none");

		// Desktop viewport (1280px) — desktop gate and split wires visible, direct wire hidden
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.waitForLoadState("networkidle");

		const directWireDesktop = page.locator(
			".home-aurora__payload-row--port .home-aurora__payload-wire--direct",
		);
		const gateDesktop = page.locator(
			".home-aurora__payload-row--port .home-aurora__payload-gate",
		);
		const wire1Desktop = page.locator(
			".home-aurora__payload-row--port .home-aurora__payload-wire--1",
		);

		await expect(directWireDesktop).toHaveCSS("display", "none");
		await expect(gateDesktop).toHaveCSS("display", "flex");
		await expect(wire1Desktop).toHaveCSS("display", "flex");
	});
});
