import { expect, test } from "@playwright/test";

/**
 * Parse the first border-radius length from computed style (e.g. "20px").
 *
 * @param value Computed `border-radius` (possibly 1–4 lengths)
 * @returns Pixel size of the first radius, or Infinity when unparseable
 */
function firstRadiusPx(value: string): number {
	const token = value.trim().split(/\s+/)[0] ?? "";
	const px = Number.parseFloat(token);
	return Number.isFinite(px) ? px : Number.POSITIVE_INFINITY;
}

test.describe("Docs search dialog", () => {
	test("mobile results are not pill-clipped", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/docs");

		await page.getByRole("button", { name: "Open Search" }).click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		const input = dialog.locator("input").first();
		await expect(input).toBeFocused();
		await input.fill("getting");

		const result = dialog.getByText(/getting started/i).first();
		await expect(result).toBeVisible();

		const radius = await dialog.evaluate(
			(el) => getComputedStyle(el).borderRadius,
		);
		expect(
			firstRadiusPx(radius),
			`expanded dialog should not use pill radius (got ${radius})`,
		).toBeLessThan(40);

		const titleHit = await result.evaluate((el) => {
			const box = el.getBoundingClientRect();
			const top = document.elementFromPoint(box.left + 12, box.top + box.height / 2);
			return Boolean(top && (el === top || el.contains(top) || top.contains(el)));
		});
		expect(titleHit, "result title should not be clipped by the dialog mask").toBe(
			true,
		);

		await page.keyboard.press("Escape");
		await expect(dialog).toBeHidden();
	});

	test("desktop search still opens, lists results, and closes", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/docs");

		await page.getByRole("button", { name: "Open Search" }).click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		const input = dialog.locator("input").first();
		await input.fill("getting");
		await expect(dialog.getByText(/getting started/i).first()).toBeVisible();

		await page.keyboard.press("Escape");
		await expect(dialog).toBeHidden();
	});
});
