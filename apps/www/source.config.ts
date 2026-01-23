import { rehypeCodeDefaultOptions, remarkNpm } from "fumadocs-core/mdx-plugins";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { transformerTwoslash } from "fumadocs-twoslash";
import { rehypeGithubAlerts } from "rehype-github-alerts";
import remarkDirective from "remark-directive";
import remarkGemoji from "remark-gemoji";
import { rehypeOptimizeInternalLinks } from "./lib/plugins/rehype-optimize-internal-links";
import { arktypeTwoslashOptions } from "./lib/twoslash-options";

export const docs = defineDocs({
	dir: "content/docs",
	docs: {
		files: ["**/*", "!**/README.md"],
		postprocess: {
			includeProcessedMarkdown: true,
		},
	},
});

export default defineConfig({
	mdxOptions: {
		rehypePlugins: [rehypeGithubAlerts, rehypeOptimizeInternalLinks],
		remarkPlugins: [remarkGemoji, remarkNpm, remarkDirective],
		rehypeCodeOptions: {
			langs: ["ts", "js", "json", "bash", "dotenv"],
			themes: {
				light: "github-light-high-contrast",
				dark: "github-dark-high-contrast",
			},
			transformers: [
				transformerTwoslash(arktypeTwoslashOptions),
				...(rehypeCodeDefaultOptions.transformers ?? []),
			],
		},
	},
});
