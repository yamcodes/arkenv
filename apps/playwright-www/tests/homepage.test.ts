import { expect, test } from "@playwright/test";

test.describe("Homepage Interactivity", () => {
	test("hero intro rise starts once per element", async ({ page }) => {
		await page.addInitScript(() => {
			let count = 0;
			document.addEventListener(
				"animationstart",
				(event) => {
					const el = event.target;
					if (!(el instanceof Element)) return;
					if (!el.closest(".home-aurora__intro")) return;
					if (
						el.classList.contains("rise") ||
						el.classList.contains("rise-blur")
					) {
						count += 1;
						Object.assign(window, { __heroRiseStarts: count });
					}
				},
				true,
			);
			Object.assign(window, { __heroRiseStarts: 0 });
		});

		await page.goto("/");
		const intro = page.locator(".home-aurora__intro");
		await expect(intro).toBeVisible();

		const expected = await intro.locator(".rise, .rise-blur").count();
		expect(expected).toBeGreaterThan(0);

		await expect
			.poll(async () => {
				const heading = await page
					.locator("#home-hero")
					.evaluate((el) => getComputedStyle(el).opacity);
				const last = await intro
					.locator(".rise, .rise-blur")
					.last()
					.evaluate((el) => getComputedStyle(el).opacity);
				return heading === "1" && last === "1";
			})
			.toBe(true);

		const starts = await page.evaluate(
			() =>
				(window as unknown as { __heroRiseStarts?: number }).__heroRiseStarts ??
				0,
		);
		// Hydrate can replay CSS entrance once (client islands under `.rise`).
		// Catch runaway loops (3×+) while allowing a single remount replay.
		expect(starts).toBeGreaterThanOrEqual(expected);
		expect(starts).toBeLessThanOrEqual(expected * 2);
	});

	test("should have functional 'Read the docs' button", async ({ page }) => {
		await page.goto("/");
		const docsButton = page
			.getByRole("link", { name: "Read the docs" })
			.first();
		await expect(docsButton).toBeVisible();

		await Promise.all([
			page.waitForURL("**/docs", { timeout: 30000 }),
			docsButton.click(),
		]);
		await expect(page).toHaveURL("/docs");
	});

	test("should have GitHub star link with correct security attributes", async ({
		page,
	}) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Header GitHub control (class-scoped: footer Elsewhere also has "GitHub",
		// and Site Nav <header> is inside fumadocs <main> so it is not a banner).
		const githubLink = page.locator("a.site-nav__github");

		await expect(githubLink).toBeVisible();
		await expect(githubLink).toHaveAttribute("target", "_blank");
		const rel = await githubLink.getAttribute("rel");
		expect(rel).toContain("noopener");
		expect(rel).toContain("noreferrer");
	});

	test("Playground nav link opens StackBlitz", async ({ page }) => {
		await page.goto("/");
		const playground = page
			.locator("nav.site-nav__links")
			.getByRole("link", { name: "Playground" });
		await expect(playground).toBeVisible();
		await expect(playground).toHaveAttribute("href", /stackblitz\.com/);
		await expect(playground).toHaveAttribute("target", "_blank");
		const rel = await playground.getAttribute("rel");
		expect(rel).toContain("noopener");
		expect(rel).toContain("noreferrer");
	});
});
