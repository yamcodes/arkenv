"use client";

import { useTreePath } from "fumadocs-ui/contexts/tree";
import type * as PageTree from "fumadocs-core/page-tree";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Fragment, useMemo } from "react";
import { cn } from "~/lib/utils/cn";

function norm(path: string): string {
	return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function folderIndexUrl(folder: PageTree.Folder): string | undefined {
	if (folder.index?.url) return folder.index.url;
	const pages = folder.children.filter(
		(child): child is PageTree.Item => child.type === "page",
	);
	if (pages.length === 0) return undefined;
	// Prefer the page whose URL is a prefix of the other children (folder index).
	const index = pages.find((page) => {
		const prefix = `${norm(page.url)}/`;
		const others = folder.children.filter((child) => {
			if (child.type === "page") return child.url !== page.url;
			return child.type === "folder";
		});
		if (others.length === 0) return true;
		return others.every((child) => {
			if (child.type === "page") return norm(child.url).startsWith(prefix);
			if (child.type === "folder") {
				const url = folderIndexUrl(child);
				return url ? norm(url).startsWith(prefix) : true;
			}
			return true;
		});
	});
	return index?.url ?? pages[0]?.url;
}

function isViewingFolderIndex(
	folder: PageTree.Folder,
	pathname: string,
): boolean {
	const indexUrl = folderIndexUrl(folder);
	if (indexUrl && norm(indexUrl) === norm(pathname)) return true;

	// Fumadocs sometimes exposes the overview only as a child page named like the folder.
	const overviewPage = folder.children.find(
		(child): child is PageTree.Item =>
			child.type === "page" &&
			norm(child.url) === norm(pathname) &&
			(String(child.name) === String(folder.name) ||
				String(child.name) === "Overview"),
	);
	return Boolean(overviewPage);
}

/**
 * Turbo-style docs tagline above the page title:
 * - Section Overview → hidden
 * - Nested Folder Overview → section name only (X), e.g. Frameworks → "Guides"
 * - n=1 (flat / Separator leaf) → section name only (X)
 * - n=2 (Nested Folder leaf) → Section > Nested Folder (X > Y)
 * Neutral foreground (not primary/cyan).
 */
export function DocsBreadcrumb({
	className,
	...props
}: React.ComponentProps<"div">) {
	const path = useTreePath();
	const pathname = usePathname();

	const items = useMemo(() => {
		const folders = path.filter(
			(node): node is PageTree.Folder => node.type === "folder",
		);

		if (folders.length === 0) return [];

		// Drop folders whose index/landing page is the current URL (Overview → no tagline).
		const ancestors = folders.filter(
			(folder) => !isViewingFolderIndex(folder, pathname),
		);

		if (ancestors.length === 0) return [];

		return ancestors.map((folder) => ({
			name: folder.name,
			url: folderIndexUrl(folder),
		}));
	}, [path, pathname]);

	if (items.length === 0) return null;

	return (
		<div
			{...props}
			data-docs-breadcrumb=""
			className={cn(
				"flex items-center gap-1.5 text-sm text-fd-muted-foreground",
				className,
			)}
		>
			{items.map((item, i) => {
				const isLast = i === items.length - 1;
				const itemClass = cn(
					"truncate",
					isLast
						? "font-medium text-fd-foreground"
						: "text-fd-muted-foreground",
				);
				return (
					<Fragment key={`${String(item.name)}-${i}`}>
						{i !== 0 ? (
							<ChevronRight
								className="size-3.5 shrink-0 text-fd-muted-foreground"
								aria-hidden="true"
							/>
						) : null}
						{item.url ? (
							<Link
								href={item.url}
								className={cn(itemClass, "transition-opacity hover:opacity-80")}
							>
								{item.name}
							</Link>
						) : (
							<span className={itemClass}>{item.name}</span>
						)}
					</Fragment>
				);
			})}
		</div>
	);
}
