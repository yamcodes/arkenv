import { expect, test } from "@playwright/test";

test.describe("Documentation sections", () => {
	test("should navigate between Getting started and Guides", async ({
		page,
	}) => {
		await page.goto("/docs/getting-started");
		await page.waitForLoadState("networkidle");

		await expect(page.locator("h1").first()).toBeVisible();
		await expect(page).toHaveURL(/\/docs\/getting-started\/?$/);

		await page.goto("/docs/guides");
		await page.waitForLoadState("networkidle");

		await expect(page.locator("h1").first()).toBeVisible();
		await expect(page).toHaveURL(/\/docs\/guides\/?$/);
	});

	test("should drill into a Nested Folder page", async ({ page }) => {
		await page.goto("/docs/frameworks/nextjs");
		await page.waitForLoadState("networkidle");

		await expect(page.locator("h1").first()).toBeVisible();
		await expect(page).toHaveURL(/\/docs\/frameworks\/nextjs\/?$/);
	});

	test("desktop sidebar drills into a Section", async ({ page }) => {
		await page.goto("/docs/getting-started");
		await page.waitForLoadState("networkidle");

		const sidebar = page.locator("#nd-sidebar");
		await expect(
			sidebar.getByRole("button", {
				name: "Back to all documentation sections",
			}),
		).toBeVisible();
		await expect(
			sidebar.getByRole("link", { name: "Installation" }),
		).toBeVisible();

		await sidebar
			.getByRole("button", { name: "Back to all documentation sections" })
			.click();
		await expect(sidebar.getByRole("link", { name: "Guides" })).toBeVisible();
		await expect(page).toHaveURL(/\/docs\/getting-started\/?$/);
	});

	test("mobile drawer uses a Sidebar Tree", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/docs/getting-started");
		await page.waitForLoadState("networkidle");

		await page.getByRole("button", { name: "Open Sidebar" }).click();
		const drawer = page.locator("#nd-sidebar-mobile");
		await expect(drawer).toBeVisible();

		await expect(
			drawer.getByRole("button", {
				name: "Back to all documentation sections",
			}),
		).toHaveCount(0);
		await expect(drawer.getByRole("link", { name: "Guides" })).toBeVisible();
		await expect(
			drawer.getByRole("link", { name: "API reference" }),
		).toBeVisible();
		await expect(
			drawer.getByRole("link", { name: "Installation" }),
		).toBeVisible();

		await drawer.getByRole("button", { name: "Expand Guides" }).click();
		await expect(
			drawer.getByRole("link", { name: "Frameworks" }),
		).toBeVisible();
		await expect(page).toHaveURL(/\/docs\/getting-started\/?$/);
	});
});
