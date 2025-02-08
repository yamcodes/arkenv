import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { rehypeGithubAlerts } from "rehype-github-alerts";

export const docs = defineDocs({
	dir: "content/docs",
});

export default defineConfig({
	mdxOptions: {
		rehypePlugins: [rehypeGithubAlerts],
	},
});
