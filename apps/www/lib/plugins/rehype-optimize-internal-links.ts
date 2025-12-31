import { visit } from "unist-util-visit";
import { optimizeInternalLink } from "../utils/url";

export function rehypeOptimizeInternalLinks() {
	// biome-ignore lint/suspicious/noExplicitAny: generic tree
	return (tree: any) => {
		// biome-ignore lint/suspicious/noExplicitAny: generic node
		visit(tree, (node: any) => {
			// Handle standard HTML elements (e.g. <a> tags converted from markdown links)
			if (node.properties && typeof node.properties.href === "string") {
				const href = node.properties.href;
				const optimized = optimizeInternalLink(href);

				if (optimized && optimized !== href) {
					node.properties.href = optimized;
				}
			}

			// Handle MDX JSX elements (e.g. <Card href="..." />)
			if (
				(node.type === "mdxJsxFlowElement" ||
					node.type === "mdxJsxTextElement") &&
				node.attributes
			) {
				// biome-ignore lint/suspicious/noExplicitAny: generic attribute
				const hrefAttr = node.attributes.find(
					(attr: any) =>
						(attr.name === "href" || attr.name === "url") &&
						typeof attr.value === "string",
				);

				if (hrefAttr) {
					const href = hrefAttr.value;
					const optimized = optimizeInternalLink(href);

					if (optimized && optimized !== href) {
						// console.log(`Optimizing MDX element href: ${href} -> ${optimized}`);
						hrefAttr.value = optimized;
					}
				}
			}
		});
	};
}
