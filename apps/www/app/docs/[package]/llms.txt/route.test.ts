import { describe, expect, it, vi } from "vitest";

vi.mock("~/lib/source", () => ({
	source: {
		getPages: () => [],
		getPageTree: () => ({
			type: "root",
			children: [
				{
					type: "folder",
					$ref: {
						folder: "getting-started",
						meta: "getting-started/meta.json",
					},
					index: {
						type: "page",
						url: "/docs/getting-started",
						name: "Getting started",
					},
					children: [
						{
							type: "page",
							url: "/docs/getting-started/installation",
							name: "Installation",
						},
					],
				},
				// Index-less package: pages only under a subfolder. Root-only matching
				// must 404; recursive descent would return the nested folder (200).
				{
					type: "folder",
					$ref: { folder: "nested-only", meta: "nested-only/meta.json" },
					children: [
						{
							type: "folder",
							index: {
								type: "page",
								url: "/docs/nested-only/sub",
								name: "Sub",
							},
							children: [
								{
									type: "page",
									url: "/docs/nested-only/sub/page",
									name: "Page",
								},
							],
						},
					],
				},
			],
		}),
	},
}));

vi.mock("fumadocs-core/source", () => ({
	llms: () => ({
		indexNode: (node: {
			$ref?: unknown;
			name?: string;
			index?: { url?: string };
		}) =>
			`Mocked Folder Index Content: ${node.index?.url ?? JSON.stringify(node.$ref) ?? node.name}`,
	}),
}));

import { source } from "~/lib/source";
import { GET, generateStaticParams } from "./route";

describe("/docs/[package]/llms.txt route", () => {
	it("should return the section-specific llms.txt content", async () => {
		const req = new Request(
			"https://arkenv.js.org/docs/getting-started/llms.txt",
		);
		const params = Promise.resolve({ package: "getting-started" });
		const response = await GET(req, { params });

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"text/plain; charset=utf-8",
		);

		const body = await response.text();
		expect(body).toBeTypeOf("string");
		expect(body).toContain("/docs/getting-started");
	});

	it("should 404 when a package folder has no index and only nested pages", async () => {
		const req = new Request("https://arkenv.js.org/docs/nested-only/llms.txt");
		const params = Promise.resolve({ package: "nested-only" });

		await expect(GET(req, { params })).rejects.toThrow();
	});

	it("should return 404 for a nonexistent package", async () => {
		const req = new Request("https://arkenv.js.org/docs/nonexistent/llms.txt");
		const params = Promise.resolve({ package: "nonexistent" });

		await expect(GET(req, { params })).rejects.toThrow();
	});

	it("should return static params for all expected top-level sections", () => {
		const spy = vi.spyOn(source, "getPages").mockReturnValue([
			{
				slugs: ["getting-started", "installation"],
				url: "/docs/getting-started/installation",
				data: { title: "Installation" },
			},
			{
				slugs: ["reference", "init"],
				url: "/docs/reference/init",
				data: { title: "init" },
			},
			{
				slugs: ["frameworks", "bun"],
				url: "/docs/frameworks/bun",
				data: { title: "Bun" },
			},
			{
				slugs: ["core-concepts", "coercion-and-parsing"],
				url: "/docs/core-concepts/coercion-and-parsing",
				data: { title: "Coercion and parsing" },
			},
		] as any);

		const params = generateStaticParams();

		expect(params).toEqual([
			{ package: "getting-started" },
			{ package: "reference" },
			{ package: "frameworks" },
			{ package: "core-concepts" },
		]);

		spy.mockRestore();
	});
});
