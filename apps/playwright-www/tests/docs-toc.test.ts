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
		await expect(toc).toHaveCSS("border-right-width", "1px");

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

		const spy = toc.locator("[data-docs-toc-spy]");
		await expect(spy).toBeVisible();
		const alignment = await toc.evaluate((rail) => {
			const marker = rail.querySelector("[data-docs-toc-spy]");
			if (!(marker instanceof HTMLElement)) return null;
			const railBox = rail.getBoundingClientRect();
			const spyBox = marker.getBoundingClientRect();
			const footer = rail.querySelector("[data-docs-toc-footer]");
			const footerBox = footer?.getBoundingClientRect() ?? null;
			return {
				spyLeft: spyBox.left,
				railLeft: railBox.left,
				footerLeft: footerBox?.left ?? null,
				footerRight: footerBox?.right ?? null,
				railRight: railBox.right,
			};
		});
		expect(alignment).not.toBeNull();
		if (!alignment) return;
		expect(Math.abs(alignment.spyLeft - alignment.railLeft)).toBeLessThan(2);
		expect(alignment.footerLeft).not.toBeNull();
		expect(alignment.footerRight).not.toBeNull();
		if (alignment.footerLeft === null || alignment.footerRight === null) {
			return;
		}
		expect(Math.abs(alignment.footerLeft - alignment.railLeft)).toBeLessThan(2);
		expect(Math.abs(alignment.footerRight - alignment.railRight)).toBeLessThan(
			2,
		);

		const heading = page.locator("#issue-codes");
		await expect(heading).toBeInViewport();
		await expect
			.poll(async () => heading.evaluate((el) => el.getBoundingClientRect().top))
			.toBeGreaterThan(100);
		await expect
			.poll(async () => heading.evaluate((el) => el.getBoundingClientRect().top))
			.toBeLessThan(150);

		await expect(page.locator("#secret-redaction")).toBeInViewport();
	});

	test("outer cage rails continue through the site footer; inner splitters stop", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1400, height: 800 });
		await page.goto("/docs/validating-your-environment/error-reporting");
		await page.waitForLoadState("networkidle");

		const footer = page.locator(".site-footer-bleed");
		await footer.scrollIntoViewIfNeeded();

		const geometry = await page.evaluate(() => {
			const bleed = document.querySelector(".site-footer-bleed");
			const pager = document.querySelector("#nd-page [data-docs-footer]");
			const rails = bleed?.querySelector(".docs-outer-rails");
			const sidebar = document.querySelector("#nd-sidebar");
			const toc = document.querySelector("#nd-toc");
			const meta = document.querySelector(".home-aurora__footer-meta");
			if (
				!(bleed instanceof HTMLElement) ||
				!(rails instanceof HTMLElement) ||
				!(sidebar instanceof HTMLElement) ||
				!(toc instanceof HTMLElement) ||
				!(meta instanceof HTMLElement)
			) {
				return null;
			}
			const bleedBox = bleed.getBoundingClientRect();
			const pagerBox = pager?.getBoundingClientRect() ?? null;
			const railsBox = rails.getBoundingClientRect();
			const sidebarBox = sidebar.getBoundingClientRect();
			const tocBox = toc.getBoundingClientRect();
			const metaBox = meta.getBoundingClientRect();
			return {
				footerTop: bleedBox.top,
				pagerBottom: pagerBox?.bottom ?? null,
				railsLeft: railsBox.left,
				railsRight: railsBox.right,
				sidebarLeft: sidebarBox.left,
				tocRight: tocBox.right,
				metaLeft: metaBox.left,
				metaRight: metaBox.right,
				viewport: window.innerWidth,
			};
		});

		expect(geometry).not.toBeNull();
		if (!geometry) return;

		expect(geometry.pagerBottom).not.toBeNull();
		if (geometry.pagerBottom === null) return;
		expect(geometry.pagerBottom).toBeLessThan(geometry.footerTop + 2);
		expect(Math.abs(geometry.railsLeft - geometry.sidebarLeft)).toBeLessThan(1);
		expect(Math.abs(geometry.railsRight - geometry.tocRight)).toBeLessThan(1);
		expect(geometry.metaLeft).toBeLessThan(1);
		expect(Math.abs(geometry.metaRight - geometry.viewport)).toBeLessThan(1);
	});

	test("site footer shares homepage license and copyright links", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1400, height: 800 });
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		const footer = page.locator(".site-footer-bleed");
		await footer.scrollIntoViewIfNeeded();

		const license = footer.getByRole("link", { name: "MIT License" });
		const author = footer.getByRole("link", { name: "Yam Borodetsky" });
		await expect(license).toBeVisible();
		await expect(author).toBeVisible();
		await expect(license).toHaveAttribute(
			"href",
			"https://github.com/yamcodes/arkenv/blob/dev/LICENSE",
		);
		await expect(author).toHaveAttribute("href", "https://yam.codes");

		const band = page.locator(".site-footer-band");
		await expect(band).toHaveCSS("padding-bottom", "0px");
		await expect(page.locator(".home-aurora__footer-meta")).toHaveCSS(
			"padding-bottom",
			"16px",
		);
		await expect(page.locator(".docs-chrome-atmosphere")).toHaveCount(0);
	});

	test("sidebar first column lines up with the Site Nav wordmark icon", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1600, height: 800 });
		await page.goto("/docs");
		await page.waitForLoadState("networkidle");

		const alignment = await page.evaluate(() => {
			const icon = document.querySelector(".site-nav__wordmark svg");
			const intro = [...document.querySelectorAll("#nd-sidebar a")].find(
				(link) => link.textContent?.trim() === "Introduction",
			);
			const sidebar = document.querySelector("#nd-sidebar");
			if (
				!(icon instanceof SVGElement) ||
				!(intro instanceof HTMLElement) ||
				!(sidebar instanceof HTMLElement)
			) {
				return null;
			}
			const range = document.createRange();
			const text = [...intro.querySelectorAll("span")].find((span) =>
				span.textContent?.includes("Introduction"),
			);
			if (text?.firstChild) {
				range.selectNodeContents(text.firstChild);
			} else {
				range.selectNodeContents(intro);
			}
			const iconBox = icon.getBoundingClientRect();
			const pillBox = intro.getBoundingClientRect();
			const railBox = sidebar.getBoundingClientRect();
			const textBox = range.getBoundingClientRect();
			return {
				iconLeft: iconBox.left,
				pillLeft: pillBox.left,
				pillRight: pillBox.right,
				textLeft: textBox.left,
				railLeft: railBox.left,
				railRight: railBox.right,
				leftGap: pillBox.left - railBox.left,
				rightGap: railBox.right - pillBox.right,
				textInset: textBox.left - pillBox.left,
			};
		});

		expect(alignment).not.toBeNull();
		if (!alignment) return;
		expect(Math.abs(alignment.pillLeft - alignment.iconLeft)).toBeLessThan(3);
		expect(Math.abs(alignment.leftGap - alignment.rightGap)).toBeLessThan(2);
		expect(alignment.textInset).toBeGreaterThanOrEqual(8);
		expect(alignment.railLeft).toBeLessThan(alignment.iconLeft - 8);
	});
});
