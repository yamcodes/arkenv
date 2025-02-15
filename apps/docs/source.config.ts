import { remarkInstall } from "fumadocs-docgen";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
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
		remarkPlugins: [remarkGemoji, remarkInstall],
	},
});
