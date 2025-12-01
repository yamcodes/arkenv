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
				const videoElement = videoButton
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

			// Test the container button which has the aspect-ratio style
			// This is what actually controls the responsive behavior
			const button = page.getByRole("button", {
				name: /open interactive demo/i,
			});
			await expect(button).toBeVisible();

			// Container should have aspect-ratio style for responsive scaling
			const buttonStyle = await button.getAttribute("style");
			expect(buttonStyle).toBeTruthy();
			expect(buttonStyle).toContain("aspect-ratio");

			// Container should have w-full class for responsive width
			const buttonClass = await button.getAttribute("class");
			expect(buttonClass).toBeTruthy();
			expect(buttonClass).toContain("w-full");

			// Optionally check video element if it exists and has classes
			const videoElement = page.locator("video").first();
			const videoCount = await videoElement.count();

			if (videoCount > 0) {
				await page.waitForTimeout(500); // Wait for video to load
				const videoClass = await videoElement.getAttribute("class");

				// If video has classes, verify they're responsive
				if (videoClass) {
					expect(videoClass).toContain("object-contain");
					// Should not have fixed width classes
					const hasFixedWidth = /w-\d+/.test(videoClass);
					expect(hasFixedWidth).toBe(false);
				}
				// If video doesn't have classes (BackgroundVideo might wrap it), that's fine
				// The container's aspect-ratio is what matters for responsiveness
			}
		});

		test("should maintain aspect ratio when resizing", async ({ page }) => {
			// Start with desktop size
			await page.setViewportSize({ width: 1280, height: 720 });
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			// Test the container button which has the aspect-ratio style, not the media element
			const containerButton = page.getByRole("button", {
				name: /open interactive demo/i,
			});
			await expect(containerButton).toBeVisible();

			// Get dimensions at desktop size
			const desktopBox = await containerButton.boundingBox();
			expect(desktopBox).not.toBeNull();

			const desktopAspectRatio = desktopBox
				? desktopBox.width / desktopBox.height
				: 0;

			// Resize to mobile
			await page.setViewportSize({ width: 375, height: 667 });
			await page.waitForTimeout(500); // Wait for resize to settle

			// Get dimensions at mobile size
			const mobileBox = await containerButton.boundingBox();
			expect(mobileBox).not.toBeNull();

			const mobileAspectRatio = mobileBox
				? mobileBox.width / mobileBox.height
				: 0;

			// Aspect ratios should be approximately equal (within 10% tolerance for browser rendering differences)
			const tolerance = 0.1;
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

			const videoButton = page.getByRole("button", {
				name: /open interactive demo/i,
			});
			await expect(videoButton).toBeVisible();

			const mediaElement = videoButton
				.locator("video, img[alt*='Demo' i]")
				.first();
			await expect(mediaElement).toBeVisible();

			const boundingBox = await mediaElement.boundingBox();
			expect(boundingBox).not.toBeNull();

			if (boundingBox) {
				// Video should not exceed max-w-6xl constraint (1280px)
				// Allow a small margin for padding and sub-pixel rendering
				expect(boundingBox.width).toBeLessThanOrEqual(1300);
			}
		});
	});
});
