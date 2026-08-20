import { describe, expect, it } from "vitest";
import { extractEnvHoverHtml } from "./extract-hero-env-hover";
import { HERO_MVP_SNIPPETS, heroMvpSnippet } from "./hero-mvp-snippets";
import { highlightHeroTwoslash } from "./highlight-hero-twoslash";

describe("highlightHeroTwoslash", () => {
	it("emits CSS hover markup for the Vanilla ArkType MVP", {
		timeout: 30_000,
	}, async () => {
		const html = await highlightHeroTwoslash(
			heroMvpSnippet("vanilla", "arktype"),
		);
		expect(html).toContain("twoslash");
		expect(html).toContain("twoslash-hover");
		expect(html).toContain("twoslash-popup-container");
		expect(html).not.toContain("twoslash-error");
		expect(html).toContain("@arkenv/core");
		const hover = extractEnvHoverHtml(html);
		expect(hover).toContain("twoslash-popup-code");
		expect(hover).toContain("DATABASE_URL");
		expect(hover).toMatch(/--shiki-dark|--shiki-light/);
	});

	it("highlights every host × validator snippet", {
		timeout: 60_000,
	}, async () => {
		for (const snippet of HERO_MVP_SNIPPETS) {
			const html = await highlightHeroTwoslash(snippet);
			expect(html, `${snippet.host}/${snippet.validator}`).toContain(
				"twoslash-hover",
			);
			expect(html, `${snippet.host}/${snippet.validator}`).not.toContain(
				"twoslash-error",
			);
		}
	});
});
