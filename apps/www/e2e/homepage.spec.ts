import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
	test("should load and display main heading", async ({ page }) => {
		await page.goto("/");

		// Check that the main heading is visible
		await expect(page.locator("h1")).toContainText(
			"Better typesafe than sorry",
		);

		// Check that the subheading mentions ArkType
		await expect(page.getByText("Bring the power of ArkType")).toBeVisible();
	});

	test("should have working navigation links", async ({ page }) => {
		await page.goto("/");

		// Check that the documentation link is present
		const docLink = page.getByRole("link", { name: "Documentation" });
		await expect(docLink).toBeVisible();
		await expect(docLink).toHaveAttribute("href", "/docs");
	});

	test("should display call-to-action buttons", async ({ page }) => {
		await page.goto("/");

		// Check for the main action buttons
		await expect(page.getByRole("button")).toHaveCount(2); // Assuming there are 2 buttons
	});

	test("should have responsive layout", async ({ page }) => {
		// Test desktop layout
		await page.setViewportSize({ width: 1200, height: 800 });
		await page.goto("/");
		await expect(page.locator("main")).toBeVisible();

		// Test mobile layout
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("main")).toBeVisible();
	});

	test("should have working external links", async ({ page }) => {
		await page.goto("/");

		// Check ArkType external link
		const arkTypeLink = page.getByRole("link", { name: "ArkType" });
		await expect(arkTypeLink).toBeVisible();
		await expect(arkTypeLink).toHaveAttribute("href", "https://arktype.io");
		await expect(arkTypeLink).toHaveAttribute("target", "_blank");
	});
});
