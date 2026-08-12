import { normalizeFenceBodyIndent } from "../normalize-code-indent";

type AstNode = {
	type: string;
	value?: string;
	children?: AstNode[];
};

/**
 * Normalize fenced code blocks to literal two-space indentation before
 * Shiki / Twoslash so tabs never render differently from spaces.
 */
export function remarkNormalizeCodeIndent() {
	return (tree: AstNode) => {
		const traverse = (node: AstNode) => {
			if (!node) return;
			if (node.type === "code" && typeof node.value === "string") {
				node.value = normalizeFenceBodyIndent(node.value);
			}
			node.children?.forEach(traverse);
		};
		traverse(tree);
	};
}
