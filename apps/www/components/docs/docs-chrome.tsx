import { drillInSidebarSlots } from "@arkenv/fumadocs-ui/components";
import type * as PageTree from "fumadocs-core/page-tree";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { CSSProperties, ReactNode } from "react";
import {
	DocsSidebarSync,
	DocsSidebarTrigger,
} from "~/components/docs/sidebar-trigger";
import { SiteFooter } from "~/components/site-footer";
import "~/components/site-footer.css";
import { SiteNavDocs } from "~/components/site-nav";
import { RELEASE_TAG } from "~/lib/config/release";
import "~/app/docs/docs-chrome.css";

/**
 * Shared docs shell: Site Nav, drill-in sidebar, TOC column, and footer rails.
 * Docs and the blog both render inside this so the reading layout stays one system.
 */
export function DocsChrome({
	tree,
	children,
}: {
	tree: PageTree.Root;
	children: ReactNode;
}) {
	return (
		<main
			style={
				{
					"--fd-layout-width": "1400px",
				} as CSSProperties
			}
		>
			{/*
			 * Stacking shell: Site Nav is a direct child so sticky chrome is
			 * not a fumadocs grid item. That grid's sidebar/TOC tracks change
			 * on resize and can leave sticky with a stale top offset.
			 * SSR it here — portaling after paint is what made the bar jump.
			 */}
			<div id="docs-chrome-shell">
				<SiteNavDocs
					sidebarTrigger={<DocsSidebarTrigger />}
					releaseTag={RELEASE_TAG}
				/>
				<DocsLayout
					tree={tree}
					sidebar={{
						collapsible: false,
					}}
					slots={{
						sidebar: drillInSidebarSlots,
					}}
					themeSwitch={{ enabled: false }}
					searchToggle={{ enabled: false }}
					nav={{
						title: <span className="sr-only">ArkEnv</span>,
						component: (
							<>
								{/* Spacer so content clears the full-bleed Site Nav; pointer-events-none so it can't steal clicks. */}
								<div
									className="pointer-events-none [grid-area:header]"
									style={{ height: "var(--fd-nav-height)" }}
									aria-hidden="true"
								/>
								{/* Registers drawer state for the Site Nav trigger (outside this grid). */}
								<DocsSidebarSync />
							</>
						),
					}}
				>
					{children}
				</DocsLayout>
			</div>
			<SiteFooter rails />
		</main>
	);
}
