import { expect, test } from "@playwright/test";

test.describe("Responsive Design", () => {
	// Mobile viewport sizes to test
	const mobileViewports = [
		{ name: "iPhone SE", width: 375, height: 667 },
		{ name: "iPhone 12 Pro", width: 390, height: 844 },
		{ name: "Samsung Galaxy S21", width: 360, height: 800 },
		{ name: "Small Mobile", width: 320, height: 568 },
	];

	test.describe("Demo Video Responsiveness", () => {
		for (const viewport of mobileViewports) {
			test(`should not cause horizontal scrolling on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
				page,
			}) => {
				// Set viewport to mobile size
				await page.setViewportSize({
					width: viewport.width,
					height: viewport.height,
				});

				// Navigate to home page where the demo video is
				await page.goto("/");
				await page.waitForLoadState("networkidle");

				// Wait for video to be visible
				const videoButton = page.getByRole("button", {
					name: /open interactive demo/i,
				});
				await expect(videoButton).toBeVisible();

				// Check that body width doesn't exceed viewport width (no horizontal scroll)
				const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
				const viewportWidth = viewport.width;

				// The body should not be wider than the viewport
				expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
			});

			test(`should scale video to fit viewport on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
				page,
			}) => {
				// Set viewport to mobile size
				await page.setViewportSize({
					width: viewport.width,
					height: viewport.height,
				});

				// Navigate to home page
				await page.goto("/");
				await page.waitForLoadState("networkidle");

				// Get the video container button
				const videoButton = page.getByRole("button", {
					name: /open interactive demo/i,
				});
				await expect(videoButton).toBeVisible();

				// Get the video or image element's bounding box
				const videoElement = page
					.locator("video, img[alt*='Demo' i]")
					.first();
				await expect(videoElement).toBeVisible();

				const boundingBox = await videoElement.boundingBox();
				expect(boundingBox).not.toBeNull();

				if (boundingBox) {
					// Video/image should not be wider than the viewport
					// Allow for some padding/margins (e.g., 32px total)
					const maxAllowedWidth = viewport.width - 32;
					expect(boundingBox.width).toBeLessThanOrEqual(maxAllowedWidth);
				}
			});
		}

		test("should have responsive width classes", async ({ page }) => {
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			// Get the video or fallback image element
			const mediaElement = page.locator("video, img[alt*='Demo' i]").first();
			await expect(mediaElement).toBeVisible();

			// Check for responsive width classes (should include w-full and h-auto)
			const className = await mediaElement.getAttribute("class");
			expect(className).toBeTruthy();

			// Should have w-full and h-auto for responsive scaling
			expect(className).toContain("w-full");
			expect(className).toContain("h-auto");
		});

		test("should maintain aspect ratio when resizing", async ({ page }) => {
			// Start with desktop size
			await page.setViewportSize({ width: 1280, height: 720 });
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			const mediaElement = page.locator("video, img[alt*='Demo' i]").first();
			await expect(mediaElement).toBeVisible();

			// Get dimensions at desktop size
			const desktopBox = await mediaElement.boundingBox();
			expect(desktopBox).not.toBeNull();

			const desktopAspectRatio = desktopBox
				? desktopBox.width / desktopBox.height
				: 0;

			// Resize to mobile
			await page.setViewportSize({ width: 375, height: 667 });
			await page.waitForTimeout(500); // Wait for resize to settle

			// Get dimensions at mobile size
			const mobileBox = await mediaElement.boundingBox();
			expect(mobileBox).not.toBeNull();

			const mobileAspectRatio = mobileBox
				? mobileBox.width / mobileBox.height
				: 0;

			// Aspect ratios should be approximately equal (within 5% tolerance)
			const tolerance = 0.05;
			const difference = Math.abs(desktopAspectRatio - mobileAspectRatio);
			const percentDifference = difference / desktopAspectRatio;

			expect(percentDifference).toBeLessThan(tolerance);
		});

		test("should not exceed maximum width on large screens", async ({
			page,
		}) => {
			// Set to a very large viewport
			await page.setViewportSize({ width: 2560, height: 1440 });
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			const mediaElement = page.locator("video, img[alt*='Demo' i]").first();
			await expect(mediaElement).toBeVisible();

			const boundingBox = await mediaElement.boundingBox();
			expect(boundingBox).not.toBeNull();

			if (boundingBox) {
				// Video should not exceed its natural maximum width (800px)
				// Allow a small margin for sub-pixel rendering
				expect(boundingBox.width).toBeLessThanOrEqual(810);
			}
		});
	});
});

