import { expect, test } from "@playwright/test";

test.describe("Theme Switching", () => {
	test("should not have hydration mismatch errors", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Filter for React hydration errors
		const hydrationErrors = consoleErrors.filter(
			(msg) =>
				msg.includes("Hydration failed") ||
				msg.includes("Text content does not match") ||
				msg.includes("did not match"),
		);

		expect(hydrationErrors).toHaveLength(0);
	});

	test("should stay dark when system prefers light and storage says light", async ({
		page,
	}) => {
		await page.emulateMedia({ colorScheme: "light" });
		await page.addInitScript(() => {
			localStorage.setItem("theme", "light");
		});

		await page.goto("/docs");
		await page.waitForLoadState("domcontentloaded");

		await expect(page.locator("html")).toHaveClass(/dark/);
		await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
	});
});
