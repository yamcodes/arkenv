import type { ReactNode } from "react";
import { DocsChrome } from "~/components/docs/docs-chrome";
import { blogPageTree } from "~/lib/blog-tree";
import { getBlogPages } from "~/lib/source";
import "./blog.css";

export default function BlogLayout({ children }: { children: ReactNode }) {
	return (
		<DocsChrome tree={blogPageTree(getBlogPages())}>{children}</DocsChrome>
	);
}
