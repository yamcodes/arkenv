import { describe, expect, it } from "vitest";
import { remarkAddNubPackageManager } from "./remark-add-nub-package-manager";

type AstNode = {
	type: string;
	name?: string;
	value?: string;
	lang?: string;
	meta?: string | null;
	attributes?: Array<{ name?: string; value?: unknown }>;
	children?: AstNode[];
};

function attr(name: string, value: unknown) {
	return { type: "mdxJsxAttribute", name, value };
}

function packageManagerTabs(npmCommand: string): AstNode {
	return {
		type: "mdxJsxFlowElement",
		name: "CodeBlockTabs",
		attributes: [
			attr("defaultValue", "npm"),
			attr("groupId", "package-manager"),
			attr("persist", null),
		],
		children: [
			{
				type: "mdxJsxFlowElement",
				name: "CodeBlockTabsList",
				attributes: [],
				children: [
					{
						type: "mdxJsxFlowElement",
						name: "CodeBlockTabsTrigger",
						attributes: [attr("value", "npm")],
						children: [{ type: "text", value: "npm" }],
					},
					{
						type: "mdxJsxFlowElement",
						name: "CodeBlockTabsTrigger",
						attributes: [attr("value", "pnpm")],
						children: [{ type: "text", value: "pnpm" }],
					},
					{
						type: "mdxJsxFlowElement",
						name: "CodeBlockTabsTrigger",
						attributes: [attr("value", "yarn")],
						children: [{ type: "text", value: "yarn" }],
					},
					{
						type: "mdxJsxFlowElement",
						name: "CodeBlockTabsTrigger",
						attributes: [attr("value", "bun")],
						children: [{ type: "text", value: "bun" }],
					},
				],
			},
			{
				type: "mdxJsxFlowElement",
				name: "CodeBlockTab",
				attributes: [attr("value", "npm")],
				children: [
					{
						type: "code",
						lang: "bash",
						meta: null,
						value: npmCommand,
					},
				],
			},
		],
	};
}

describe("remarkAddNubPackageManager", () => {
	it("appends a nub tab converted from the npm command", () => {
		const tree: AstNode = {
			type: "root",
			children: [packageManagerTabs("npx arkenv init")],
		};

		remarkAddNubPackageManager()(tree);

		const tabs = tree.children?.[0];
		const list = tabs?.children?.[0];
		const nubTrigger = list?.children?.find(
			(child) =>
				child.name === "CodeBlockTabsTrigger" &&
				child.attributes?.some(
					(a) => a.name === "value" && a.value === "nub",
				),
		);
		const nubTab = tabs?.children?.find(
			(child) =>
				child.name === "CodeBlockTab" &&
				child.attributes?.some(
					(a) => a.name === "value" && a.value === "nub",
				),
		);

		expect(nubTrigger?.children?.[0]).toEqual({ type: "text", value: "nub" });
		expect(nubTab?.children?.[0]?.value).toBe("nubx arkenv init");
	});

	it("converts install lines to nub add", () => {
		const tree: AstNode = {
			type: "root",
			children: [
				packageManagerTabs(
					"npm install @arkenv/core arktype\nnpm install -D @arkenv/vite-plugin",
				),
			],
		};

		remarkAddNubPackageManager()(tree);

		const nubTab = tree.children?.[0]?.children?.find(
			(child) =>
				child.name === "CodeBlockTab" &&
				child.attributes?.some(
					(a) => a.name === "value" && a.value === "nub",
				),
		);
		expect(nubTab?.children?.[0]?.value).toBe(
			"nub add @arkenv/core arktype\nnub add -D @arkenv/vite-plugin",
		);
	});

	it("is a no-op when a nub tab already exists", () => {
		const tabs = packageManagerTabs("npx arkenv init");
		tabs.children?.[0]?.children?.push({
			type: "mdxJsxFlowElement",
			name: "CodeBlockTabsTrigger",
			attributes: [attr("value", "nub")],
			children: [{ type: "text", value: "nub" }],
		});
		tabs.children?.push({
			type: "mdxJsxFlowElement",
			name: "CodeBlockTab",
			attributes: [attr("value", "nub")],
			children: [
				{ type: "code", lang: "bash", value: "nubx arkenv init" },
			],
		});
		const tree: AstNode = { type: "root", children: [tabs] };

		remarkAddNubPackageManager()(tree);

		const nubTabs =
			tabs.children?.filter(
				(child) =>
					child.name === "CodeBlockTab" &&
					child.attributes?.some(
						(a) => a.name === "value" && a.value === "nub",
					),
			) ?? [];
		expect(nubTabs).toHaveLength(1);
	});

	it("ignores CodeBlockTabs without the package-manager group", () => {
		const tree: AstNode = {
			type: "root",
			children: [
				{
					type: "mdxJsxFlowElement",
					name: "CodeBlockTabs",
					attributes: [attr("defaultValue", "npm")],
					children: [],
				},
			],
		};

		remarkAddNubPackageManager()(tree);

		expect(tree.children?.[0]?.children).toEqual([]);
	});
});
