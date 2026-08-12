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
		expect(starts).toBe(expected);
	});

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

		// Header GitHub control (class-scoped: footer Elsewhere also has "GitHub",
		// and Site Nav <header> is inside fumadocs <main> so it is not a banner).
		const githubLink = page.locator("a.site-nav__github");

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
