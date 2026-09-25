import { blogPosts, docs } from "fumadocs-mdx:collections/server";
import type { autocomplete } from "@ark/util";
import * as SimpleIcons from "@icons-pack/react-simple-icons";
import {
	loader,
	type MetaData,
	type PageData,
	type StaticSource,
} from "fumadocs-core/source";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";
import { icons } from "lucide-react";
import { createElement } from "react";
import { NewBadge, UpdatedBadge } from "~/components/ui/new-badge";
import { isPublishedBlogPage } from "./blog-published";

export type IconName = keyof typeof icons | "New" | "Updated";

export const SITE_URL = "https://arkenv.js.org";

/**
 * fumadocs-core 16.15 does not infer collection fields from `toFumadocsSource()`.
 * Restate the source generic so `loader()` keeps `body`, `toc`, and frontmatter.
 */
function loaderSource<Page extends PageData, Meta extends MetaData>(
	source: StaticSource<{ pageData: Page; metaData: Meta }>,
): StaticSource<{ pageData: Page; metaData: Meta }> {
	return source;
}

export const source = loader({
	baseUrl: "/docs",
	source: loaderSource<
		(typeof docs)["docs"][number],
		(typeof docs)["meta"][number]
	>(docs.toFumadocsSource()),
	icon(icon?: autocomplete<IconName>) {
		if (!icon) return;

		if (icon in icons) return createElement(icons[icon as never]);
		if (`Si${icon}` in SimpleIcons)
			// biome-ignore lint/performance/noDynamicNamespaceImportAccess: I don't care about bundle size
			return createElement(SimpleIcons[`Si${icon}` as never]);
		if (icon === "New") return <NewBadge className="order-1" />;
		if (icon === "Updated") return <UpdatedBadge className="order-1" />;

		throw new Error(`${icon} is not a valid icon`);
	},
});

export const blog = loader({
	baseUrl: "/blog",
	// defineCollections({ type: "doc" }) yields an array — use toFumadocsSource(pages, []).
	source: loaderSource<(typeof blogPosts)[number], MetaData>(
		toFumadocsSource(blogPosts, []),
	),
});

export { isPublishedBlogPage } from "./blog-published";

/**
 * Blog pages for listing/RSS/sitemap.
 * Drafts are included on local `next dev` and Vercel preview / branch
 * deploys via `isPublishedBlogPage`; production listing, RSS, and
 * sitemap always omit them.
 */
export function getBlogPages() {
	return blog.getPages().filter((page) => isPublishedBlogPage(page));
}
