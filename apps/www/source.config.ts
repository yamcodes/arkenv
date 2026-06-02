import { rehypeCodeDefaultOptions, remarkNpm } from "fumadocs-core/mdx-plugins";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { transformerTwoslash } from "fumadocs-twoslash";
import remarkDirective from "remark-directive";
import remarkGemoji from "remark-gemoji";
import { rehypeOptimizeInternalLinks } from "./lib/plugins/rehype-optimize-internal-links";
import { arktypeTwoslashOptions } from "./lib/twoslash-options";

const CALLOUT_CONTAINER = "CalloutContainer";
const CALLOUT_TITLE = "CalloutTitle";
const CALLOUT_DESCRIPTION = "CalloutDescription";

type RemarkPlugin = (tree: AstNode) => void;

type AstNode = {
	type: string;
	name?: string;
	attributes?: any;
	children?: AstNode[];
	data?: Record<string, unknown>;
};

function remarkDirectiveAdmonitionCustom(options: {
	types: Record<string, string>;
}): RemarkPlugin {
	const types = options.types;
	return (tree: AstNode) => {
		const traverse = (node: AstNode) => {
			if (!node) return;
			if (node.children) {
				node.children = node.children.filter(
					(c): c is AstNode => c !== undefined && c !== null,
				);
				node.children.forEach(traverse);

				node.children = node.children
					.map((child) => {
						if (!child) return child;
						if (
							child.type === "containerDirective" &&
							child.name &&
							child.name in types
						) {
							const attributes = [
								{
									type: "mdxJsxAttribute",
									name: "type",
									value: types[child.name],
								},
							];
							for (const [k, v] of Object.entries(child.attributes ?? {})) {
								attributes.push({
									type: "mdxJsxAttribute",
									name: k,
									value: v as any,
								});
							}

							const titleNodes: AstNode[] = [];
							const descriptionNodes: AstNode[] = [];
							for (const item of child.children ?? []) {
								if (!item) continue;
								if (item.type === "paragraph" && item.data?.directiveLabel) {
									if (item.children) {
										titleNodes.push(
											...item.children.filter((c): c is AstNode => !!c),
										);
									}
								} else {
									descriptionNodes.push(item);
								}
							}

							const children: AstNode[] = [];
							if (titleNodes.length > 0) {
								children.push({
									type: "mdxJsxFlowElement",
									name: CALLOUT_TITLE,
									attributes: [],
									children: titleNodes,
								});
							}
							if (descriptionNodes.length > 0) {
								children.push({
									type: "mdxJsxFlowElement",
									name: CALLOUT_DESCRIPTION,
									attributes: [],
									children: descriptionNodes,
								});
							}

							return {
								type: "mdxJsxFlowElement",
								attributes,
								name: CALLOUT_CONTAINER,
								children,
							} as AstNode;
						}
						return child;
					})
					.filter((c): c is AstNode => !!c);
			}
		};
		traverse(tree);
	};
}

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
		rehypePlugins: [rehypeOptimizeInternalLinks],
		remarkPlugins: [
			remarkGemoji,
			remarkNpm,
			remarkDirective,
			[
				remarkDirectiveAdmonitionCustom,
				{
					types: {
						note: "info",
						tip: "info",
						important: "warning",
						warning: "warning",
						caution: "error",
					},
				},
			],
		],
		rehypeCodeOptions: {
			langs: ["ts", "tsx", "js", "jsx", "json", "bash", "dotenv"],
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
