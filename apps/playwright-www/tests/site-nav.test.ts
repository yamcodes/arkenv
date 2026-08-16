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

	test("docs header stays at inset after shrinking from desktop", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1400, height: 900 });
		await page.goto("/docs/validating-environment-variables/error-reporting");
		await page.locator(".site-nav").waitFor();

		await page.setViewportSize({ width: 529, height: 900 });

		const metrics = await page.evaluate(() => {
			const nav = document.querySelector(".site-nav");
			const root = document.querySelector(".site-nav-root");
			const title = document.querySelector("h1");
			if (!nav || !root || !title) {
				return { ok: false as const, reason: "missing nodes" };
			}
			const navRect = nav.getBoundingClientRect();
			const titleRect = title.getBoundingClientRect();
			const inset = Number.parseFloat(getComputedStyle(nav).top);
			return {
				ok: true as const,
				navTop: navRect.top,
				navBottom: navRect.bottom,
				rootTop: root.getBoundingClientRect().top,
				titleTop: titleRect.top,
				inset,
				parentId: root.parentElement?.id ?? "",
			};
		});

		expect(metrics.ok, "reason" in metrics ? metrics.reason : "").toBe(true);
		if (!metrics.ok) return;

		expect(metrics.parentId).toBe("docs-chrome-shell");
		expect(metrics.rootTop).toBeCloseTo(0, 0);
		expect(metrics.navTop).toBeCloseTo(metrics.inset, 0);
		expect(metrics.titleTop).toBeGreaterThan(metrics.navBottom);
	});
});
