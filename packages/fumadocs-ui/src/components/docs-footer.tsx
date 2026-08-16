"use client";

import { usePathname } from "fumadocs-core/framework";
import Link from "fumadocs-core/link";
import type * as PageTree from "fumadocs-core/page-tree";
import type { FooterProps } from "fumadocs-ui/layouts/docs/page/slots/footer";
import { useFooterItems } from "fumadocs-ui/utils/use-footer-items";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/utils/cn";

type Item = Pick<PageTree.Item, "name" | "url">;

function norm(path: string): string {
	return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * Turbo/geistdocs previous–next pager: hairline rule, muted Previous/Next
 * labels, destination title + chevron. No card chrome.
 */
export function DocsFooter({
	items,
	children,
	className,
	...props
}: FooterProps) {
	const footerList = useFooterItems();
	const pathname = usePathname();
	const { previous, next } = useMemo(() => {
		if (items) return items;
		const idx = footerList.findIndex(
			(item) => norm(item.url) === norm(pathname),
		);
		if (idx === -1) return {};
		return {
			previous: footerList[idx - 1],
			next: footerList[idx + 1],
		};
	}, [footerList, items, pathname]);

	if (!previous && !next && !children) return null;

	return (
		<>
			<div
				{...props}
				data-docs-footer=""
				className={cn(
					"mt-8 grid grid-cols-2 gap-4 border-t border-fd-border pt-6",
					className,
				)}
			>
				{previous ? <FooterItem item={previous} direction="previous" /> : null}
				{next ? <FooterItem item={next} direction="next" /> : null}
			</div>
			{children}
		</>
	);
}

function FooterItem({
	item,
	direction,
}: {
	item: Item;
	direction: "previous" | "next";
}) {
	const isNext = direction === "next";
	const Icon = isNext ? ChevronRight : ChevronLeft;

	return (
		<Link
			href={item.url}
			data-docs-pager=""
			data-no-underline=""
			aria-label={`${isNext ? "Next" : "Previous"}: ${String(item.name)}`}
			className={cn(
				"group grid w-fit max-w-full items-center gap-x-1.5 gap-y-1 text-fd-foreground",
				"rounded-sm no-underline outline-none transition-colors",
				"focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 focus-visible:ring-offset-fd-background",
				"active:opacity-80",
				isNext
					? "col-start-2 grid-cols-[1fr_auto] justify-self-end text-right"
					: "grid-cols-[auto_1fr]",
			)}
		>
			<span
				className={cn(
					"text-sm text-fd-muted-foreground",
					isNext ? "col-start-1" : "col-start-2",
				)}
			>
				{isNext ? "Next" : "Previous"}
			</span>
			<Icon
				aria-hidden="true"
				className={cn(
					"row-start-2 size-4 shrink-0 self-center text-fd-muted-foreground transition-colors group-hover:text-fd-foreground rtl:rotate-180",
					isNext ? "col-start-2" : "col-start-1",
				)}
			/>
			<span
				className={cn(
					"row-start-2 min-w-0 font-medium",
					isNext ? "col-start-1" : "col-start-2",
				)}
			>
				{item.name}
			</span>
		</Link>
	);
}
