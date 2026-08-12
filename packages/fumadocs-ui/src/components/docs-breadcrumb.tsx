"use client";

import type * as PageTree from "fumadocs-core/page-tree";
import { useTreePath } from "fumadocs-ui/contexts/tree";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";
import { cn } from "@/utils/cn";
import { getDocsTaglineSegments } from "./docs-tagline";

/**
 * Turbo-style docs tagline above the page title:
 * - Overview pages → hidden
 * - n=1 (flat / Separator leaf) → section name (`API reference`)
 * - n=2 (Nested Folder leaf) → `NestedFolder > Page` (`Frameworks > Next.js`)
 * Neutral foreground (not primary/cyan). Separator labels are never segments.
 */
export function DocsBreadcrumb({
	className,
	...props
}: React.ComponentProps<"div">) {
	const path = useTreePath();
	const pathname = usePathname();

	const segments = useMemo(
		() => getDocsTaglineSegments(path as PageTree.Node[], pathname),
		[path, pathname],
	);

	if (segments.length === 0) return null;

	return (
		<div
			{...props}
			data-docs-breadcrumb=""
			data-docs-tagline=""
			className={cn(
				"mb-1 flex items-center gap-1.5 text-sm text-fd-muted-foreground",
				className,
			)}
		>
			{segments.map((segment, index) => (
				<Fragment key={segment}>
					{index !== 0 ? (
						<span
							className="shrink-0 text-fd-muted-foreground"
							aria-hidden="true"
						>
							{">"}
						</span>
					) : null}
					<span className="truncate text-fd-muted-foreground">{segment}</span>
				</Fragment>
			))}
		</div>
	);
}
