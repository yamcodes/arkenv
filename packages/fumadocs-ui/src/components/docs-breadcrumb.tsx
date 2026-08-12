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
 * - Flat / Separator leaf → section name (`API reference`)
 * - Nested Folder leaf → `InnermostFolder > Page` (`Frameworks > Next.js`)
 *   (3+ folder depths still collapse to those two segments)
 * Neutral foreground (not primary/cyan). Separator labels are never segments.
 *
 * Still exported as the `breadcrumb` layout slot for API compatibility, but
 * renders plain text (not linked crumbs).
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
