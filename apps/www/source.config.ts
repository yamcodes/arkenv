import { rehypeCodeDefaultOptions, remarkNpm } from "fumadocs-core/mdx-plugins";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { transformerTwoslash } from "fumadocs-twoslash";
import { rehypeGithubAlerts } from "rehype-github-alerts";
import remarkGemoji from "remark-gemoji";

export const docs = defineDocs({
	dir: "content/docs",
	docs: {
		files: ["**/*", "!**/README.md"],
	},
});

export default defineConfig({
	mdxOptions: {
		rehypePlugins: [rehypeGithubAlerts],
		remarkPlugins: [remarkGemoji, remarkNpm],
		rehypeCodeOptions: {
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
			transformers: [
				...(rehypeCodeDefaultOptions.transformers ?? []),
				transformerTwoslash(),
			],
		},
	},
});
