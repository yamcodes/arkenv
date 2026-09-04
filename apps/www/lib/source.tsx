import { blogPosts, docs } from "fumadocs-mdx:collections/server";
import type { autocomplete } from "@ark/util";
import * as SimpleIcons from "@icons-pack/react-simple-icons";
import { loader } from "fumadocs-core/source";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";
import { icons } from "lucide-react";
import { createElement } from "react";
import { NewBadge, UpdatedBadge } from "~/components/ui/new-badge";
import { isPublishedBlogPage } from "~/lib/is-published-blog-page";

export type IconName = keyof typeof icons | "New" | "Updated";

export const SITE_URL = "https://arkenv.js.org";

export const source = loader({
	baseUrl: "/docs",
	source: docs.toFumadocsSource(),
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
	source: toFumadocsSource(blogPosts, []),
});

export { isPublishedBlogPage };

/**
 * Blog pages for listing/RSS/sitemap.
 * Drafts are included only in `next dev` via `isPublishedBlogPage`;
 * production listing, RSS, and sitemap always omit drafts.
 */
export function getBlogPages() {
	return blog.getPages().filter((page) => isPublishedBlogPage(page));
}
