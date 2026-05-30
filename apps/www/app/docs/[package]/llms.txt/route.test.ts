import { describe, expect, it, vi } from "vitest";

vi.mock("~/lib/source", () => ({
	source: {
		getPages: () => [],
		getPageTree: () => ({
			type: "root",
			children: [
				{
					type: "folder",
					$ref: "arkenv/meta.json",
					children: [
						{
							type: "page",
							url: "/docs/arkenv",
							name: "ArkEnv",
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
	it("should return the package-specific llms.txt content for arkenv", async () => {
		const req = new Request("https://arkenv.js.org/docs/arkenv/llms.txt");
		const params = Promise.resolve({ package: "arkenv" });
		const response = await GET(req, { params });

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"text/plain; charset=utf-8",
		);

		const body = await response.text();
		expect(body).toBeTypeOf("string");
		expect(body).toContain("arkenv");
	});

	it("should return 404 for a nonexistent package", async () => {
		const req = new Request("https://arkenv.js.org/docs/nonexistent/llms.txt");
		const params = Promise.resolve({ package: "nonexistent" });

		await expect(GET(req, { params })).rejects.toThrow();
	});

	it("should return static params for all expected packages", () => {
		const spy = vi.spyOn(source, "getPages").mockReturnValue([
			{
				slugs: ["arkenv", "intro"],
				url: "/docs/arkenv",
				data: { title: "ArkEnv" },
			},
			{ slugs: ["cli", "intro"], url: "/docs/cli", data: { title: "CLI" } },
			{
				slugs: ["bun-plugin", "intro"],
				url: "/docs/bun-plugin",
				data: { title: "Bun Plugin" },
			},
			{
				slugs: ["nextjs", "intro"],
				url: "/docs/nextjs",
				data: { title: "NextJS" },
			},
			{
				slugs: ["vite-plugin", "intro"],
				url: "/docs/vite-plugin",
				data: { title: "Vite Plugin" },
			},
		] as any);

		const params = generateStaticParams();

		expect(params).toEqual([
			{ package: "arkenv" },
			{ package: "cli" },
			{ package: "bun-plugin" },
			{ package: "nextjs" },
			{ package: "vite-plugin" },
		]);

		spy.mockRestore();
	});
});
