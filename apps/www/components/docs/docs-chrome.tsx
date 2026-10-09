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
 * Shared docs shell: Site Nav, optional drill-in sidebar, TOC column, and footer.
 * The blog turns the sidebar off and keeps the article + “On this page” rail.
 */
export function DocsChrome({
	tree,
	children,
	sidebar = true,
}: {
	tree: PageTree.Root;
	children: ReactNode;
	/**
	 * Docs drill-in sidebar. Off for the blog (TanStack-style: article + TOC).
	 */
	sidebar?: boolean;
}) {
	return (
		<main
			style={
				{
					// Docs and blog share this cage so the wordmark and search
					// sit on the same rails.
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
			<div id="docs-chrome-shell" data-sidebar={sidebar ? "on" : "off"}>
				<SiteNavDocs
					sidebarTrigger={sidebar ? <DocsSidebarTrigger /> : undefined}
					releaseTag={RELEASE_TAG}
				/>
				<DocsLayout
					tree={tree}
					sidebar={{
						enabled: sidebar,
						collapsible: false,
					}}
					slots={
						sidebar
							? {
									sidebar: drillInSidebarSlots,
								}
							: undefined
					}
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
								{sidebar ? <DocsSidebarSync /> : null}
							</>
						),
					}}
				>
					{children}
				</DocsLayout>
			</div>
			{/* Outer rails continue through the footer on docs and the blog. */}
			<SiteFooter rails />
		</main>
	);
}
