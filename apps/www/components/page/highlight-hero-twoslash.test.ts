import { describe, expect, it } from "vitest";
import { BYOV_CODE } from "./bring-your-own-validator";
import { extractEnvHoverHtml } from "./extract-hero-env-hover";
import { HERO_MVP_SNIPPETS, heroMvpSnippet } from "./hero-mvp-snippets";
import {
	highlightHeroTwoslash,
	highlightTs,
	highlightTwoslash,
} from "./highlight-hero-twoslash";

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

describe("highlightTwoslash", () => {
	it("typechecks homepage TypeScript snippets", {
		timeout: 60_000,
	}, async () => {
		const cases: Array<[string, "arktype" | "standard"]> = [
			[BYOV_CODE, "arktype"],
		];

		for (const [code, engine] of cases) {
			const html = await highlightTwoslash(code, engine);
			expect(html).toContain("twoslash-hover");
			expect(html).not.toContain("twoslash-error");
		}
	});
});

describe("highlightTs", () => {
	it("highlights TypeScript without Twoslash", async () => {
		const html = await highlightTs(`const url = "https://example.com";`);
		expect(html).toContain("example.com");
		expect(html).not.toContain("twoslash-error");
	});
});
