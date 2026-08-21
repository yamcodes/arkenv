import { expect, test } from "@playwright/test";

test.describe("Docs table of contents", () => {
	test("highlights the clicked heading when the next section is also on screen", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1400, height: 800 });
		await page.goto("/docs/validating-your-environment/error-reporting");
		await page.waitForLoadState("networkidle");

		const toc = page.locator("#nd-toc");
		await expect(toc).toBeVisible();
		await expect(toc).toHaveCSS("border-left-width", "1px");

		await toc.getByRole("link", { name: "Issue codes", exact: true }).click();

		const issueCodes = toc.getByRole("link", {
			name: "Issue codes",
			exact: true,
		});
		const secretRedaction = toc.getByRole("link", {
			name: "Secret redaction",
			exact: true,
		});

		await expect(issueCodes).toHaveAttribute("data-active", "true");
		await expect(secretRedaction).not.toHaveAttribute("data-active", "true");

		const heading = page.locator("#issue-codes");
		await expect(heading).toBeInViewport();
		const headingTop = await heading.evaluate(
			(element) => element.getBoundingClientRect().top,
		);
		expect(headingTop).toBeGreaterThan(100);
		expect(headingTop).toBeLessThan(150);

		await expect(page.locator("#secret-redaction")).toBeInViewport();
	});
});
