import { describe, expect, it, vi } from "vitest";

vi.mock("~/lib/source", () => ({
	source: {
		getPages: () => [
			{
				url: "/docs/arkenv",
				data: {
					title: "ArkEnv",
				},
			},
		],
		getPageTree: () => ({
			type: "root",
			children: [],
		}),
	},
}));

vi.mock("fumadocs-core/source", () => ({
	llms: () => ({
		index: () => "Mocked Root Index Content: ArkEnv",
	}),
}));

import { GET } from "./route";

describe("/llms.txt route", () => {
	it("should return the llms.txt content", async () => {
		const response = await GET();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");

		const body = await response.text();
		expect(body).toBeTypeOf("string");
		expect(body).toContain("ArkEnv");
	});
});
