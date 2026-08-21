import { transformerTwoslash } from "@shikijs/twoslash";
import { createFileSystemTypesCache } from "fumadocs-twoslash/cache-fs";
import { cache } from "react";
import { codeToHtml, type ShikiTransformer } from "shiki";
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

const SHIKI_THEMES = {
	light: "github-light-high-contrast",
	dark: "github-dark-high-contrast",
} as const;

function hastText(node: {
	type?: string;
	value?: string;
	children?: unknown[];
}): string {
	if (node.type === "text") return node.value ?? "";
	if (!Array.isArray(node.children)) return "";
	return node.children
		.map((child) =>
			hastText(
				child as { type?: string; value?: string; children?: unknown[] },
			),
		)
		.join("");
}

const diffLineClass: ShikiTransformer = {
	name: "arkenv-diff-line-class",
	line(hast) {
		const text = hastText(hast);
		if (text.startsWith("+")) this.addClassToHast(hast, "diff-add");
		else if (text.startsWith("-")) this.addClassToHast(hast, "diff-del");
	},
};

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

export async function highlightTwoslash(
	code: string,
	engine: HeroTwoslashEngine,
) {
	return codeToHtml(normalizeFenceBodyIndent(code), {
		lang: "ts",
		themes: SHIKI_THEMES,
		defaultColor: false,
		meta: { __raw: "twoslash" },
		transformers: [heroTransformer(engine)],
	});
}

export async function highlightTs(code: string) {
	return codeToHtml(normalizeFenceBodyIndent(code), {
		lang: "ts",
		themes: SHIKI_THEMES,
		defaultColor: false,
	});
}

export async function highlightDiff(code: string) {
	return codeToHtml(normalizeFenceBodyIndent(code), {
		lang: "diff",
		themes: SHIKI_THEMES,
		defaultColor: false,
		transformers: [diffLineClass],
	});
}

export async function highlightHeroTwoslash(snippet: HeroMvpSnippet) {
	return highlightTwoslash(
		snippet.code,
		heroMvpEngine(snippet.host, snippet.validator),
	);
}

export const highlightHeroMvpExamples = cache(async () =>
	Promise.all(
		HERO_MVP_SNIPPETS.filter((snippet) => snippet.host === "vanilla").map(
			async (snippet) => ({
				host: snippet.host,
				validator: snippet.validator,
				importLine: snippet.importLine,
				html: await highlightHeroTwoslash(snippet),
				code: snippet.code,
			}),
		),
	),
);
