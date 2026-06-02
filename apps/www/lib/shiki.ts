import { transformerTwoslash } from "fumadocs-twoslash";
import { codeToHtml, createCssVariablesTheme } from "shiki";
import { arktypeTwoslashOptions } from "~/lib/twoslash-options";

const theme = createCssVariablesTheme({
	variablePrefix: "--shiki-",
	variableDefaults: {
		foreground: "#1F2328",
		background: "transparent",
	},
});

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
		theme,
		transformers: [transformerTwoslash(twoslashOptions)],
	});
}
