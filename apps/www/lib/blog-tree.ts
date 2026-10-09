import type * as PageTree from "fumadocs-core/page-tree";

export type BlogTreePage = {
	url: string;
	data: {
		title: string;
		description?: string;
		date: string | Date;
	};
};

function toTime(date: string | Date): number {
	return (typeof date === "string" ? new Date(date) : date).getTime();
}

/**
 * Sidebar tree for the blog, in the same shape as the docs page tree:
 * one section whose index is the blog overview and whose children are posts,
 * newest first.
 */
export function blogPageTree(pages: readonly BlogTreePage[]): PageTree.Root {
	const posts = [...pages].sort(
		(a, b) => toTime(b.data.date) - toTime(a.data.date),
	);

	return {
		name: "Blog",
		children: [
			{
				type: "folder",
				$id: "blog",
				name: "Blog",
				index: {
					type: "page",
					name: "Overview",
					url: "/blog",
				},
				children: posts.map((page) => ({
					type: "page" as const,
					name: page.data.title,
					url: page.url,
					description: page.data.description,
				})),
			},
		],
	};
}
