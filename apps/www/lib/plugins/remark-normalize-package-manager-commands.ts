import { normalizePackageManagerCommand } from "../normalize-package-manager-command";

type AstNode = {
	type: string;
	value?: string;
	children?: AstNode[];
};

/**
 * Runs after fumadocs `remarkNpm` so generated tabs keep `bun install` and
 * `npm install` instead of `bun add` / `npm i`.
 */
export function remarkNormalizePackageManagerCommands() {
	return (tree: AstNode) => {
		const traverse = (node: AstNode) => {
			if (!node) return;
			if (node.type === "code" && typeof node.value === "string") {
				node.value = normalizePackageManagerCommand(node.value);
			}
			node.children?.forEach(traverse);
		};
		traverse(tree);
	};
}
