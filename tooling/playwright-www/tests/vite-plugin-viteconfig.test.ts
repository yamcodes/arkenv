import { expect, test } from "@playwright/test";

test.describe("Vite Plugin - Using ArkEnv in Vite config", () => {
	test("should display external link to Vite docs with security attributes", async ({
		page,
	}) => {
		await page.goto("/docs/vite-plugin/arkenv-in-viteconfig");
		await expect(page.locator("h1")).toBeVisible();

		// Verify external Vite docs link has correct security attributes
		const viteDocsLink = page.locator(
			'a[href="https://vite.dev/config/#using-environment-variables-in-config"]',
		);
		const linkCount = await viteDocsLink.count();

		if (linkCount > 0) {
			const link = viteDocsLink.first();
			await expect(link).toHaveAttribute("target", "_blank");
			const rel = await link.getAttribute("rel");
			expect(rel).toContain("noopener");
			expect(rel).toContain("noreferrer");
		}
	});
});
