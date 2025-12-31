import { visit } from "unist-util-visit";
import { optimizeInternalLink } from "../utils/url";

export function rehypeOptimizeInternalLinks() {
	// biome-ignore lint/suspicious/noExplicitAny: generic tree
	return (tree: any) => {
		// biome-ignore lint/suspicious/noExplicitAny: generic node
		visit(tree, "element", (node: any) => {
			if (node.tagName === "a" && typeof node.properties.href === "string") {
				const href = node.properties.href;
				const optimized = optimizeInternalLink(href);

				if (optimized && optimized !== href) {
					node.properties.href = optimized;
				}
			}
		});
	};
}
