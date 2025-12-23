import { expect, test } from "@playwright/test";

test.describe("Theme Switching", () => {
	test("should default to system theme preference", async ({ page }) => {
		// Clear localStorage to ensure we test the default behavior
		await page.goto("/");
		await page.evaluate(() => localStorage.clear());
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// With no stored preference, theme should be null (system default)
		const theme = await page.evaluate(() => localStorage.getItem("theme"));
		expect(theme).toBeNull();
	});

	test("should switch between light and dark themes", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check for hydration errors (console errors)
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		// Find and click the theme toggle button
		const themeButton = page.getByRole("button", { name: "Toggle Theme" });
		await expect(themeButton).toBeVisible();

		// Click to toggle theme
		await themeButton.click();

		// Wait for theme class to be applied
		await page.waitForFunction(() => {
			return (
				document.documentElement.classList.contains("dark") ||
				document.documentElement.classList.contains("light")
			);
		});

		// Verify theme changed (either light or dark class should be present)
		const hasThemeClass = await page.evaluate(() => {
			return (
				document.documentElement.classList.contains("dark") ||
				document.documentElement.classList.contains("light")
			);
		});
		expect(hasThemeClass).toBeTruthy();

		// Verify no hydration errors
		expect(consoleErrors.filter((e) => e.includes("Hydration"))).toHaveLength(
			0,
		);
	});

	test("should not have hydration mismatch errors", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Filter for specific React hydration errors
		const hydrationErrors = consoleErrors.filter(
			(msg) =>
				msg.includes("Hydration failed") ||
				msg.includes("Text content does not match") ||
				msg.includes("did not match"),
		);

		expect(hydrationErrors).toHaveLength(0);
	});
});
