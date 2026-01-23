import type { Root } from "hast";
import type { MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx-jsx";
import { visit } from "unist-util-visit";
import { optimizeInternalLink } from "@arkenv/fumadocs-ui-theme";

type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement;

export function rehypeOptimizeInternalLinks() {
	return (tree: Root) => {
		// handle standard element
		visit(tree, "element", (node) => {
			if (node.properties && typeof node.properties.href === "string") {
				const href = node.properties.href;
				const optimized = optimizeInternalLink(href);

				if (optimized !== href) {
					node.properties.href = optimized;
				}
			}
		});

		// handle mdx jsx element
		// biome-ignore lint/suspicious/noExplicitAny: generic tree traversal
		visit(tree as any, (node: any) => {
			if (
				node.type === "mdxJsxFlowElement" ||
				node.type === "mdxJsxTextElement"
			) {
				const mdxNode = node as MdxJsxElement;
				const hrefAttr = mdxNode.attributes.find(
					(attr) =>
						attr.type === "mdxJsxAttribute" &&
						(attr.name === "href" || attr.name === "url") &&
						typeof attr.value === "string",
				);

				if (
					hrefAttr &&
					hrefAttr.type === "mdxJsxAttribute" &&
					typeof hrefAttr.value === "string"
				) {
					const href = hrefAttr.value;
					const optimized = optimizeInternalLink(href);

					if (optimized !== href) {
						hrefAttr.value = optimized;
					}
				}
			}
		});
	};
}
