import type { Root } from "hast";
import type { MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx-jsx";
import { visit } from "unist-util-visit";
import { optimizeInternalLink } from "../utils/url";

type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement;

export function rehypeOptimizeInternalLinks() {
	return (tree: Root) => {
		// handle standard element
		visit(tree, "element", (node) => {
			if (node.properties && typeof node.properties.href === "string") {
				const href = node.properties.href;
				const optimized = optimizeInternalLink(href);

				if (optimized && optimized !== href) {
					node.properties.href = optimized;
				}
			}
		});

		// handle mdx jsx element
		visit(
			tree,
			(node): node is MdxJsxElement =>
				node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement",
			(node) => {
				const hrefAttr = node.attributes.find(
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

					if (optimized && optimized !== href) {
						hrefAttr.value = optimized;
					}
				}
			},
		);
	};
}
