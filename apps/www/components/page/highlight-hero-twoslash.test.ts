import { describe, expect, it } from "vitest";
import { AFTER, BEFORE } from "./before-after-compare";
import { BYOV_EXAMPLES } from "./bring-your-own-validator";
import { extractEnvHoverHtml } from "./extract-hero-env-hover";
import { HERO_MVP_SNIPPETS, heroMvpSnippet } from "./hero-mvp-snippets";
import {
	highlightHeroTwoslash,
	highlightTwoslash,
} from "./highlight-hero-twoslash";
import { COMPILED_BUNDLE_CODE, FLAT_ENV_CODE } from "./secure-boundary";

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
			[BEFORE, "arktype"],
			[AFTER, "arktype"],
			[FLAT_ENV_CODE, "arktype"],
			[COMPILED_BUNDLE_CODE, "arktype"],
			...BYOV_EXAMPLES.map(
				(example) =>
					[
						example.code,
						example.id === "arktype" ? "arktype" : "standard",
					] as const,
			),
		];

		for (const [code, engine] of cases) {
			const html = await highlightTwoslash(code, engine);
			expect(html).toContain("twoslash-hover");
			expect(html).not.toContain("twoslash-error");
		}
	});
});
