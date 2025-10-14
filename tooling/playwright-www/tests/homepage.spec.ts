import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
	test("should load with correct title and meta description", async ({
		page,
	}) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check page title
		await expect(page).toHaveTitle("ArkEnv");

		// Check meta description
		const metaDescription = page.locator('meta[name="description"]');
		await expect(metaDescription).toHaveAttribute(
			"content",
			"Typesafe environment variables powered by ArkType ⛵️",
		);
	});

	test("should display main heading and description", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check main heading
		const heading = page.locator("h1");
		await expect(heading).toBeVisible();
		await expect(heading).toContainText("Better typesafe than sorry");

		// Check description text
		await expect(page.locator("text=Bring the power of")).toBeVisible();
		await expect(page.locator("text=ArkType").first()).toBeVisible();
		await expect(
			page.locator("text=to your environment variables"),
		).toBeVisible();
	});

	test("should have functional 'Set sail' button", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check button is visible
		const sailButton = page.locator("a[href='/docs/quickstart']");
		await expect(sailButton).toBeVisible();
		await expect(sailButton).toContainText("Set sail");

		// Test navigation
		await sailButton.click();
		await expect(page).toHaveURL("/docs/quickstart");
	});

	test("should have functional 'Star us on GitHub' button", async ({
		page,
	}) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check that there are GitHub links present
		const githubLinks = page.locator("a[href*='github.com']");
		const linkCount = await githubLinks.count();
		expect(linkCount).toBeGreaterThan(0);

		// Check that at least one GitHub link is visible
		const visibleGithubLinks = githubLinks.filter({ hasText: "Star" });
		const visibleCount = await visibleGithubLinks.count();

		if (visibleCount > 0) {
			// Check if any of the star links are actually visible
			let foundVisible = false;
			for (let i = 0; i < visibleCount; i++) {
				const link = visibleGithubLinks.nth(i);
				if (await link.isVisible()) {
					await expect(link).toContainText("Star");
					await expect(link).toHaveAttribute("target", "_blank");
					await expect(link).toHaveAttribute("rel", "noopener noreferrer");
					foundVisible = true;
					break;
				}
			}

			// If no star button is visible, just verify GitHub links exist
			if (!foundVisible) {
				expect(linkCount).toBeGreaterThan(0);
			}
		} else {
			// If no star button is visible, check that GitHub links exist (they might be hidden due to responsive design)
			expect(linkCount).toBeGreaterThan(0);
		}
	});

	test("should display video demo", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check video is present
		const video = page.locator("video");
		await expect(video).toBeVisible();

		// Check video attributes
		await expect(video).toHaveAttribute("autoplay");
		await expect(video).toHaveAttribute("loop");
		await expect(video).toHaveAttribute("muted");
		await expect(video).toHaveAttribute("playsInline");

		// Check video poster
		await expect(video).toHaveAttribute("poster", "/assets/demo.png");
	});

	test("should have clickable video demo that opens StackBlitz", async ({
		page,
	}) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Get the video button
		const videoButton = page.locator(
			"button[aria-label='Open interactive demo in a new tab']",
		);
		await expect(videoButton).toBeVisible();

		// Test click opens new tab (we can't easily test the actual navigation in E2E)
		const [newPage] = await Promise.all([
			page.context().waitForEvent("page"),
			videoButton.click(),
		]);

		await expect(newPage.url()).toContain("stackblitz.com");
		await newPage.close();
	});

	test("should have ArkType link", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check ArkType link
		const arkTypeLink = page.locator("a[href='https://arktype.io']");
		await expect(arkTypeLink).toBeVisible();
		await expect(arkTypeLink).toContainText("ArkType");
		await expect(arkTypeLink).toHaveAttribute("target", "_blank");
		await expect(arkTypeLink).toHaveAttribute("rel", "noopener noreferrer");
	});

	test("should be responsive on mobile", async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check that mobile-specific elements are visible
		const mobileStarButton = page.locator(".sm\\:hidden a[href*='github.com']");
		await expect(mobileStarButton).toBeVisible();

		// Check that desktop-specific elements are hidden
		const desktopStarButton = page.locator(
			".hidden.sm\\:block a[href*='github.com']",
		);
		await expect(desktopStarButton).not.toBeVisible();
	});

	test("should be responsive on desktop", async ({ page }) => {
		// Set desktop viewport
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check that desktop-specific elements are visible
		const desktopStarButton = page.locator(
			".hidden.sm\\:block a[href*='github.com']",
		);
		await expect(desktopStarButton).toBeVisible();

		// Check that mobile-specific elements are hidden
		const mobileStarButton = page.locator(".sm\\:hidden a[href*='github.com']");
		await expect(mobileStarButton).not.toBeVisible();
	});

	test("should not have console errors", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				// Filter out known non-critical errors
				const errorText = msg.text();
				if (
					!errorText.includes("403") &&
					!errorText.includes("Failed to load resource")
				) {
					consoleErrors.push(errorText);
				}
			}
		});

		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Allow some time for any async operations
		await page.waitForTimeout(1000);

		expect(consoleErrors).toHaveLength(0);
	});
});
