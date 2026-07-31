import { codeToHtml } from "shiki";

/**
 * Shared landing-page highlighter — matches docs + 01 DECLARATIVE
 * (github-*-high-contrast dual theme).
 */
export async function highlightTs(code: string) {
	return codeToHtml(code, {
		lang: "ts",
		themes: {
			light: "github-light-high-contrast",
			dark: "github-dark-high-contrast",
		},
		defaultColor: false,
	});
}
