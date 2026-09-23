import { normalizePackageManagerCommand } from "../normalize-package-manager-command";

type AstNode = {
	type: string;
	value?: string;
	children?: AstNode[];
};

/**
 * Runs after fumadocs `remarkNpm` (and the Nub tab injector) so generated tabs
 * keep `bun install` / `npm install` / `nub add` instead of `bun add` /
 * `npm i`, and apply {@link INSTALL_TAG} to arkenv runners and `@arkenv/*`
 * install lines.
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
