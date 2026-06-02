import { transformerTwoslash } from "fumadocs-twoslash";
import { codeToHtml } from "shiki";
import { arktypeTwoslashOptions } from "~/lib/twoslash-options";

const TS_LANGS = new Set(["ts", "tsx", "js", "jsx"]);
const SUPPORTED_LANGS = new Set([
	"ts",
	"tsx",
	"js",
	"jsx",
	"bash",
	"json",
	"dotenv",
]);

const twoslashOptions = {
	...arktypeTwoslashOptions,
	explicitTrigger: false,
};

export async function highlight(code: string, lang: string) {
	const normalizedLang = SUPPORTED_LANGS.has(lang) ? lang : "ts";
	return codeToHtml(code, {
		lang: normalizedLang,
		themes: {
			light: "github-light-high-contrast",
			dark: "github-dark-high-contrast",
		},
		transformers: TS_LANGS.has(normalizedLang)
			? [transformerTwoslash(twoslashOptions)]
			: [],
	});
}
