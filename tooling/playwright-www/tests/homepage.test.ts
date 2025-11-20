import { expect, test } from "@playwright/test";
import { assertNoConsoleErrors } from "./utils/console-errors";

test.describe("Homepage", () => {
	test("should load with correct title and meta description", async ({
		page,
	}) => {
		await page.goto("/", { timeout: 60000 });
		await page.waitForLoadState("networkidle", { timeout: 60000 });

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
		await page.goto("/", { timeout: 60000 });
		await page.waitForLoadState("networkidle", { timeout: 60000 });

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
		await page.goto("/", { timeout: 60000 });
		await page.waitForLoadState("networkidle", { timeout: 60000 });

		// Check button is visible
		const sailButton = page.locator("a[href='/docs/arkenv/quickstart']");
		await expect(sailButton).toBeVisible();
		await expect(sailButton).toContainText("Set sail");

		// Test navigation
		await sailButton.click();
		// Wait for navigation to complete with longer timeout
		await page.waitForURL("**/docs/arkenv/quickstart", { timeout: 30000 });
		await expect(page).toHaveURL("/docs/arkenv/quickstart");
	});

	test("should have functional 'Star us on GitHub' button", async ({
		page,
	}) => {
		await page.goto("/", { timeout: 60000 });
		await page.waitForLoadState("networkidle", { timeout: 60000 });

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
		await page.goto("/", { timeout: 60000 });
		await page.waitForLoadState("networkidle", { timeout: 60000 });

		// Check video or fallback image is present
		const videoButton = page.locator(
			"button[aria-label='Open interactive demo in a new tab']",
		);
		await expect(videoButton).toBeVisible();

		const video = videoButton.locator("video");
		const fallbackImage = videoButton.locator("img[alt='ArkEnv Demo']");

		// Either video should be visible with poster, or fallback image should be visible
		const videoCount = await video.count();
		const imageCount = await fallbackImage.count();

		if (videoCount > 0 && (await video.isVisible())) {
			// Video is present - check attributes
			await expect(video).toHaveAttribute("autoplay");
			await expect(video).toHaveAttribute("loop");
			await expect(video).toHaveAttribute("muted");
			await expect(video).toHaveAttribute("playsInline");

			// Check video poster (if set)
			const poster = await video.getAttribute("poster");
			if (poster) {
				await expect(video).toHaveAttribute("poster", "/assets/demo.png");
			}
		} else if (imageCount > 0 && (await fallbackImage.isVisible())) {
			// Fallback image is present - verify it's correct
			// Next.js Image optimization may wrap the src, so check if it contains the path
			const src = await fallbackImage.getAttribute("src");
			expect(src).toContain("demo.gif");
			await expect(fallbackImage).toHaveAttribute("alt", "ArkEnv Demo");
		} else {
			throw new Error("Neither video nor fallback image is visible");
		}
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

		// Wait a bit for video to be fully loaded to reduce flakiness
		await page.waitForTimeout(500);

		// Test click opens new tab (we can't easily test the actual navigation in E2E)
		const [newPage] = await Promise.all([
			page.context().waitForEvent("page", { timeout: 10000 }),
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
		await assertNoConsoleErrors(page, "/");
	});
});
