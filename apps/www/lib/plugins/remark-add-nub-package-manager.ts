import { convertNpmToNub } from "../npm-to-nub";

type AstNode = {
	type: string;
	name?: string;
	value?: string;
	lang?: string;
	meta?: string | null;
	attributes?: Array<{
		type?: string;
		name?: string;
		value?: unknown;
	}>;
	children?: AstNode[];
};

function getAttr(node: AstNode, name: string): unknown {
	return node.attributes?.find((attr) => attr.name === name)?.value;
}

function isPackageManagerTabs(node: AstNode): boolean {
	return (
		node.type === "mdxJsxFlowElement" &&
		node.name === "CodeBlockTabs" &&
		getAttr(node, "groupId") === "package-manager"
	);
}

function findChild(node: AstNode, name: string): AstNode | undefined {
	return node.children?.find(
		(child) => child.type === "mdxJsxFlowElement" && child.name === name,
	);
}

function findTab(node: AstNode, value: string): AstNode | undefined {
	return node.children?.find(
		(child) =>
			child.type === "mdxJsxFlowElement" &&
			child.name === "CodeBlockTab" &&
			getAttr(child, "value") === value,
	);
}

function hasTrigger(list: AstNode, value: string): boolean {
	return (
		list.children?.some(
			(child) =>
				child.type === "mdxJsxFlowElement" &&
				child.name === "CodeBlockTabsTrigger" &&
				getAttr(child, "value") === value,
		) ?? false
	);
}

/**
 * After fumadocs `remarkNpm`, append a Nub tab derived from the npm tab.
 * Keeps stock npm/pnpm/yarn/bun conversion untouched.
 */
export function remarkAddNubPackageManager() {
	return (tree: AstNode) => {
		const visit = (node: AstNode) => {
			if (isPackageManagerTabs(node)) {
				const list = findChild(node, "CodeBlockTabsList");
				const npmTab = findTab(node, "npm");
				const npmCode = npmTab?.children?.find((child) => child.type === "code");

				if (
					list &&
					npmCode &&
					typeof npmCode.value === "string" &&
					!hasTrigger(list, "nub") &&
					!findTab(node, "nub")
				) {
					list.children ??= [];
					list.children.push({
						type: "mdxJsxFlowElement",
						name: "CodeBlockTabsTrigger",
						attributes: [
							{
								type: "mdxJsxAttribute",
								name: "value",
								value: "nub",
							},
						],
						children: [{ type: "text", value: "nub" }],
					});

					node.children ??= [];
					node.children.push({
						type: "mdxJsxFlowElement",
						name: "CodeBlockTab",
						attributes: [
							{
								type: "mdxJsxAttribute",
								name: "value",
								value: "nub",
							},
						],
						children: [
							{
								type: "code",
								lang: "bash",
								meta: npmCode.meta,
								value: convertNpmToNub(npmCode.value),
							},
						],
					});
				}
			}

			node.children?.forEach(visit);
		};

		visit(tree);
	};
}
