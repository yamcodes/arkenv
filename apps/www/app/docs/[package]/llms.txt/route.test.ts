import { describe, expect, it, vi } from "vitest";

vi.mock("~/lib/source", () => ({
	source: {
		getPages: () => [],
		getPageTree: () => ({
			type: "root",
			children: [
				{
					type: "folder",
					$ref: "getting-started/meta.json",
					children: [
						{
							type: "page",
							url: "/docs/getting-started",
							name: "Getting started",
						},
					],
				},
			],
		}),
	},
}));

vi.mock("fumadocs-core/source", () => ({
	llms: () => ({
		indexNode: (node: any) =>
			`Mocked Folder Index Content: ${node.$ref || node.name}`,
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
		expect(body).toContain("getting-started");
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
				slugs: ["guides", "frameworks", "bun"],
				url: "/docs/guides/frameworks/bun",
				data: { title: "Bun" },
			},
			{
				slugs: ["validating-your-environment", "coercion-and-parsing"],
				url: "/docs/validating-your-environment/coercion-and-parsing",
				data: { title: "Coercion and parsing" },
			},
		] as any);

		const params = generateStaticParams();

		expect(params).toEqual([
			{ package: "getting-started" },
			{ package: "reference" },
			{ package: "guides" },
			{ package: "validating-your-environment" },
		]);

		spy.mockRestore();
	});
});
