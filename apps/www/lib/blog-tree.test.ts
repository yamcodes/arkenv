import { describe, expect, it } from "vitest";
import { blogPageTree } from "./blog-tree";

describe("blogPageTree", () => {
	it("puts the overview at /blog and lists posts newest first", () => {
		const tree = blogPageTree([
			{
				url: "/blog/old",
				data: {
					title: "Old",
					description: "Earlier note",
					date: "2024-01-02",
				},
			},
			{
				url: "/blog/new",
				data: { title: "New", date: "2026-03-04" },
			},
		]);

		expect(tree.children).toHaveLength(1);
		const section = tree.children[0];
		expect(section).toMatchObject({
			type: "folder",
			name: "Blog",
			index: { type: "page", name: "Overview", url: "/blog" },
		});
		if (section?.type !== "folder") {
			throw new Error("expected a Blog folder");
		}
		expect(section.children).toEqual([
			{
				type: "page",
				name: "New",
				url: "/blog/new",
				description: undefined,
			},
			{
				type: "page",
				name: "Old",
				url: "/blog/old",
				description: "Earlier note",
			},
		]);
	});
});
