import { remarkNpm } from "fumadocs-core/mdx-plugins";
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

function getAttr(node: AstNode | undefined, name: string): unknown {
	return node?.attributes?.find((a) => a.name === name)?.value;
}

/** Run fumadocs remarkNpm with the same persist id as `source.config.ts`. */
function runRemarkNpm(tree: AstNode) {
	const transform = remarkNpm({
		persist: { id: "package-manager" },
	});
	// Unified transformers require (tree, file, next); file/next are unused here.
	transform(tree as never, {} as never, undefined as never);
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
				child.attributes?.some((a) => a.name === "value" && a.value === "nub"),
		);
		const nubTab = tabs?.children?.find(
			(child) =>
				child.name === "CodeBlockTab" &&
				child.attributes?.some((a) => a.name === "value" && a.value === "nub"),
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
				child.attributes?.some((a) => a.name === "value" && a.value === "nub"),
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
			children: [{ type: "code", lang: "bash", value: "nubx arkenv init" }],
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
		const tabs = packageManagerTabs("npx arkenv init");
		tabs.attributes = [attr("defaultValue", "npm")];
		const tree: AstNode = { type: "root", children: [tabs] };

		remarkAddNubPackageManager()(tree);

		const nubTab = tabs.children?.find(
			(child) =>
				child.name === "CodeBlockTab" &&
				child.attributes?.some(
					(a) => a.name === "value" && a.value === "nub",
				),
		);
		expect(nubTab).toBeUndefined();
	});

	it("appends nub after real remarkNpm output", () => {
		const tree: AstNode = {
			type: "root",
			children: [
				{
					type: "code",
					lang: "package-install",
					value: "npx arkenv init",
				},
			],
		};

		runRemarkNpm(tree);
		remarkAddNubPackageManager()(tree);

		const tabs = tree.children?.[0];
		expect(tabs?.name).toBe("CodeBlockTabs");
		expect(getAttr(tabs, "groupId")).toBe("package-manager");

		const nubTab = tabs?.children?.find(
			(child) =>
				child.name === "CodeBlockTab" &&
				child.attributes?.some(
					(a) => a.name === "value" && a.value === "nub",
				),
		);
		expect(nubTab?.children?.[0]?.value).toBe("nubx arkenv init");

		const list = tabs?.children?.find(
			(child) => child.name === "CodeBlockTabsList",
		);
		const nubTrigger = list?.children?.find(
			(child) =>
				child.name === "CodeBlockTabsTrigger" &&
				child.attributes?.some(
					(a) => a.name === "value" && a.value === "nub",
				),
		);
		expect(nubTrigger?.children?.[0]).toEqual({ type: "text", value: "nub" });
	});

	it("converts install fences through real remarkNpm then the injector", () => {
		const tree: AstNode = {
			type: "root",
			children: [
				{
					type: "code",
					lang: "package-install",
					value: "npm install @arkenv/core arktype",
				},
			],
		};

		runRemarkNpm(tree);
		remarkAddNubPackageManager()(tree);

		const nubTab = tree.children?.[0]?.children?.find(
			(child) =>
				child.name === "CodeBlockTab" &&
				child.attributes?.some(
					(a) => a.name === "value" && a.value === "nub",
				),
		);
		expect(nubTab?.children?.[0]?.value).toBe("nub add @arkenv/core arktype");
	});
});
