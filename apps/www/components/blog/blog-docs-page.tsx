import {
	DocsBreadcrumb,
	DocsFooter,
	docsTocSlots,
} from "@arkenv/fumadocs-ui/components";
import type { TOCItemType } from "fumadocs-core/toc";
import { DocsPage } from "fumadocs-ui/page";
import type { ReactNode } from "react";
import { DocsTocLinks } from "~/components/docs/toc-links";
import { FeatureFlags } from "~/lib/feature-flags";
import { fetchRoadmap } from "~/lib/roadmap/fetch-roadmap";

/**
 * Blog article frame. Same page slots as docs: breadcrumb, pager, TOC rail.
 */
export async function BlogDocsPage({
	pageTitle,
	editHref,
	toc,
	children,
}: {
	pageTitle: string;
	editHref?: string;
	toc: TOCItemType[];
	children: ReactNode;
}) {
	const roadmap = await fetchRoadmap();
	const tocLinks = (
		<DocsTocLinks
			pageTitle={pageTitle}
			editHref={editHref}
			roadmapPercent={roadmap.percent}
			roadmapStale={roadmap.stale}
		/>
	);

	return (
		<DocsPage
			toc={toc}
			tableOfContent={{ enabled: true, footer: tocLinks, single: true }}
			tableOfContentPopover={{
				enabled: FeatureFlags.DOCS_TOC_POPOVER,
				footer: tocLinks,
			}}
			slots={{
				breadcrumb: DocsBreadcrumb,
				footer: DocsFooter,
				toc: docsTocSlots,
			}}
		>
			<div className="grow">{children}</div>
		</DocsPage>
	);
}
