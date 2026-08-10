import { expect, test } from "@playwright/test";

test.describe("Site Nav", () => {
	test("docs header controls are hit-testable at scroll top on mobile", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/docs");
		await page.evaluate(() => {
			document.documentElement.scrollTop = 0;
			window.scrollTo({ top: 0, left: 0, behavior: "instant" });
		});

		expect(await page.evaluate(() => window.scrollY)).toBe(0);

		const hit = await page.evaluate(() => {
			const btn = document.querySelector(".site-nav__menu-toggle");
			if (!btn) return { ok: false, reason: "missing toggle" as const };
			const rect = btn.getBoundingClientRect();
			const top = document.elementFromPoint(
				rect.left + rect.width / 2,
				rect.top + rect.height / 2,
			);
			return {
				ok: Boolean(top?.closest(".site-nav__menu-toggle")),
				reason: top
					? ((top as HTMLElement).className?.toString?.() ?? top.tagName).slice(
							0,
							80,
						)
					: "null",
			};
		});
		expect(hit.ok, `menu toggle covered by ${hit.reason}`).toBe(true);

		await page.getByRole("button", { name: "Toggle menu" }).click();
		const menu = page.locator(".site-nav__menu-panel--open");
		await expect(menu).toBeVisible();
		await expect(menu.getByRole("link", { name: "Docs" })).toBeVisible();
	});
});
