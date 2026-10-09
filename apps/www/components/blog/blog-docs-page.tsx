import { DocsBreadcrumb, docsTocSlots } from "@arkenv/fumadocs-ui/components";
import type { TOCItemType } from "fumadocs-core/toc";
import { DocsPage } from "fumadocs-ui/page";
import type { ReactNode } from "react";

/**
 * Blog article frame. Docs page slots, without the pager or TOC extras
 * (scroll, edit, feedback, star, roadmap). The rail is headings only.
 */
export function BlogDocsPage({
	toc,
	children,
}: {
	toc: TOCItemType[];
	children: ReactNode;
}) {
	return (
		<DocsPage
			toc={toc}
			footer={{ enabled: false }}
			tableOfContent={{
				enabled: toc.length > 0,
				single: true,
			}}
			tableOfContentPopover={{
				enabled: false,
			}}
			slots={{
				breadcrumb: DocsBreadcrumb,
				toc: docsTocSlots,
			}}
		>
			<div className="grow">{children}</div>
		</DocsPage>
	);
}
