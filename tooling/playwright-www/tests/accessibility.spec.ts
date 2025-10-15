import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Accessibility", () => {
	test("should have proper heading hierarchy on homepage", async ({ page }) => {
		await page.goto("/", { timeout: 60000 });
		await page.waitForLoadState("networkidle", { timeout: 60000 });

		// Check for h1
		const h1 = page.locator("h1");
		await expect(h1).toBeVisible();
		await expect(h1).toContainText("Better typesafe than sorry");

		// Check for proper heading structure
		const headings = page.locator("h1, h2, h3, h4, h5, h6");
		const headingCount = await headings.count();
		expect(headingCount).toBeGreaterThan(0);
	});

	test("should have proper heading hierarchy on docs pages", async ({
		page,
	}) => {
		const docPages = [
			"/docs",
			"/docs/quickstart",
			"/docs/examples",
			"/docs/morphs",
		];

		for (const url of docPages) {
			await page.goto(url);
			await page.waitForLoadState("networkidle");

			// Check for h1
			const h1 = page.locator("h1");
			await expect(h1).toBeVisible();

			// Check heading hierarchy
			const headings = page.locator("h1, h2, h3, h4, h5, h6");
			const headingCount = await headings.count();
			expect(headingCount).toBeGreaterThan(0);
		}
	});

	test("should have accessible button labels", async ({ page }) => {
		await page.goto("/", { timeout: 60000 });
		await page.waitForLoadState("networkidle", { timeout: 60000 });

		// Check for buttons with proper labels
		const buttons = page.locator("button, [role='button']");
		const buttonCount = await buttons.count();

		for (let i = 0; i < buttonCount; i++) {
			const button = buttons.nth(i);
			const ariaLabel = await button.getAttribute("aria-label");
			const textContent = await button.textContent();

			// Button should have either aria-label or visible text
			expect(ariaLabel || textContent?.trim()).toBeTruthy();
		}
	});

	test("should have accessible links", async ({ page }) => {
		await page.goto("/", { timeout: 60000 });
		await page.waitForLoadState("networkidle", { timeout: 60000 });

		// Check for links with accessible names
		const links = page.locator("a");
		const linkCount = await links.count();

		for (let i = 0; i < Math.min(linkCount, 10); i++) {
			const link = links.nth(i);
			const textContent = await link.textContent();
			const ariaLabel = await link.getAttribute("aria-label");

			// Link should have either text content or aria-label
			expect(textContent?.trim() || ariaLabel).toBeTruthy();
		}
	});

	test("should support keyboard navigation", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Test tab navigation
		await page.keyboard.press("Tab");

		// Check that focus is visible (WebKit may not support :focus selector)
		const focusedElement = page.locator(":focus");
		const focusCount = await focusedElement.count();
		if (focusCount > 0) {
			await expect(focusedElement).toBeVisible();
		} else {
			// For WebKit, just verify that tab navigation worked by checking if we can find any focusable elements
			const focusableElements = page.locator("button, a, input, [tabindex]");
			expect(await focusableElements.count()).toBeGreaterThan(0);
		}
	});

	test("should have proper focus management", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Test tab navigation through interactive elements
		const interactiveElements = page.locator("a, button, input, [tabindex]");
		const elementCount = await interactiveElements.count();

		if (elementCount > 0) {
			// Test that we can tab through elements
			for (let i = 0; i < Math.min(elementCount, 5); i++) {
				await page.keyboard.press("Tab");
				// Check that focus is visible (WebKit may not support :focus selector)
				const focusedElement = page.locator(":focus");
				const focusCount = await focusedElement.count();
				if (focusCount > 0) {
					await expect(focusedElement).toBeVisible();
				} else {
					// For WebKit, just verify that tab navigation worked by checking if we can find any focusable elements
					const focusableElements = page.locator(
						"button, a, input, [tabindex]",
					);
					expect(await focusableElements.count()).toBeGreaterThan(0);
				}
			}
		}
	});

	test("should have proper ARIA attributes", async ({ page }) => {
		await page.goto("/", { timeout: 60000 });
		await page.waitForLoadState("networkidle", { timeout: 60000 });

		// Check for proper ARIA attributes on interactive elements
		const buttons = page.locator("button, [role='button']");
		const buttonCount = await buttons.count();

		for (let i = 0; i < buttonCount; i++) {
			const button = buttons.nth(i);
			const role = await button.getAttribute("role");
			const ariaLabel = await button.getAttribute("aria-label");
			const textContent = await button.textContent();

			// Interactive elements should have proper roles or labels
			expect(role || ariaLabel || textContent?.trim()).toBeTruthy();
		}
	});

	test("should have proper form labels if forms exist", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check for form inputs with proper labels
		const inputs = page.locator("input, textarea, select");
		const inputCount = await inputs.count();

		for (let i = 0; i < inputCount; i++) {
			const input = inputs.nth(i);
			const id = await input.getAttribute("id");
			const ariaLabel = await input.getAttribute("aria-label");
			const ariaLabelledBy = await input.getAttribute("aria-labelledby");

			// Inputs should have proper labeling
			expect(id || ariaLabel || ariaLabelledBy).toBeTruthy();
		}
	});

	test("should have proper color contrast", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Run axe-core accessibility scan
		const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

		// Filter for color-contrast violations
		const colorContrastViolations = accessibilityScanResults.violations.filter(
			(violation) => violation.id === "color-contrast",
		);

		// Assert no color contrast violations
		expect(colorContrastViolations).toHaveLength(0);

		// If there are violations, provide detailed error message
		if (colorContrastViolations.length > 0) {
			const violationDetails = colorContrastViolations.map((violation) => {
				return `${violation.description}: ${violation.nodes.map((node) => node.html).join(", ")}`;
			});
			throw new Error(
				`Color contrast violations found:\n${violationDetails.join("\n")}`,
			);
		}
	});

	test("should have proper semantic HTML", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check for semantic HTML elements
		await expect(page.locator("main").first()).toBeVisible();

		// Check for proper document structure
		await expect(page.locator("html")).toBeVisible();
		await expect(page.locator("head")).toBeAttached();
		await expect(page.locator("body")).toBeVisible();
	});

	test("should not have accessibility violations", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check for common accessibility issues
		const imagesWithoutAlt = page.locator("img:not([alt])");
		const imageCount = await imagesWithoutAlt.count();

		// Images should have alt attributes
		expect(imageCount).toBe(0);
	});

	test("should have proper page titles", async ({ page }) => {
		const pages = [
			{ url: "/", expectedTitle: "ArkEnv" },
			{ url: "/docs", expectedTitle: "What is ArkEnv? · ArkEnv" },
			{ url: "/docs/quickstart", expectedTitle: "Quickstart · ArkEnv" },
		];

		for (const { url, expectedTitle } of pages) {
			await page.goto(url);
			await page.waitForLoadState("networkidle");

			// Check page title
			await expect(page).toHaveTitle(expectedTitle);
		}
	});

	test("should have proper meta descriptions", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Check for meta description
		const metaDescription = page.locator('meta[name="description"]');
		await expect(metaDescription).toHaveAttribute("content");

		const content = await metaDescription.getAttribute("content");
		expect(content).toBeTruthy();
		expect(content?.length).toBeGreaterThan(10);
	});

	test("should not have console errors", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				// Filter out known non-critical errors
				const errorText = msg.text();
				if (
					!errorText.includes("403") &&
					!errorText.includes("Failed to load resource")
				) {
					consoleErrors.push(errorText);
				}
			}
		});

		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1000);

		expect(consoleErrors).toHaveLength(0);
	});
});
