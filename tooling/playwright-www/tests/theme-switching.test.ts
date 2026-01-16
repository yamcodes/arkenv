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
});
