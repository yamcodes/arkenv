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
		indexNode: (node: any) => `Mocked Folder Index Content: ${node.$ref || node.name}`,
	}),
}));

import { GET } from "./route";

describe("/docs/[package]/llms.txt route", () => {
	it("should return the package-specific llms.txt content for arkenv", async () => {
		const req = new Request("https://arkenv.js.org/docs/arkenv/llms.txt");
		const params = Promise.resolve({ package: "arkenv" });
		const response = await GET(req, { params });

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");

		const body = await response.text();
		expect(body).toBeTypeOf("string");
		expect(body).toContain("arkenv");
	});

	it("should return 404 for a nonexistent package", async () => {
		const req = new Request("https://arkenv.js.org/docs/nonexistent/llms.txt");
		const params = Promise.resolve({ package: "nonexistent" });

		await expect(GET(req, { params })).rejects.toThrow();
	});
});
