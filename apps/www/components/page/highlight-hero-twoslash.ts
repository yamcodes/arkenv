import { transformerTwoslash } from "@shikijs/twoslash";
import { createFileSystemTypesCache } from "fumadocs-twoslash/cache-fs";
import { cache } from "react";
import { codeToHtml } from "shiki";
import { normalizeFenceBodyIndent } from "~/lib/normalize-code-indent";
import {
	HERO_MVP_SNIPPETS,
	type HeroMvpSnippet,
	heroMvpEngine,
} from "./hero-mvp-snippets";
import {
	type HeroTwoslashEngine,
	heroTwoslashOptions,
} from "./hero-mvp-twoslash-options";

const transformers = new Map<
	HeroTwoslashEngine,
	ReturnType<typeof transformerTwoslash>
>();

function heroTransformer(engine: HeroTwoslashEngine) {
	const existing = transformers.get(engine);
	if (existing) return existing;
	const { cacheDir, ...options } = heroTwoslashOptions(engine);
	const created = transformerTwoslash({
		...options,
		typesCache: createFileSystemTypesCache(cacheDir),
	});
	transformers.set(engine, created);
	return created;
}

export async function highlightHeroTwoslash(snippet: HeroMvpSnippet) {
	return codeToHtml(normalizeFenceBodyIndent(snippet.code), {
		lang: "ts",
		themes: {
			light: "github-light-high-contrast",
			dark: "github-dark-high-contrast",
		},
		defaultColor: false,
		meta: { __raw: "twoslash" },
		transformers: [
			heroTransformer(heroMvpEngine(snippet.host, snippet.validator)),
		],
	});
}

export const highlightHeroMvpExamples = cache(async () =>
	Promise.all(
		HERO_MVP_SNIPPETS.filter((snippet) => snippet.host === "vanilla").map(
			async (snippet) => ({
				host: snippet.host,
				validator: snippet.validator,
				importLine: snippet.importLine,
				html: await highlightHeroTwoslash(snippet),
			}),
		),
	),
);
