import { drillInSidebarSlots } from "@arkenv/fumadocs-ui/components";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { CSSProperties, ReactNode } from "react";
import { DocsSidebarTrigger } from "~/components/docs/sidebar-trigger";
import { SiteFooter } from "~/components/site-footer";
import "~/components/site-footer.css";
import { SiteNavDocs } from "~/components/site-nav";
import { source } from "~/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<main
			style={
				{
					"--fd-layout-width": "1400px",
				} as CSSProperties
			}
		>
			<DocsLayout
				tree={source.pageTree}
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
							{/* Spacer so docs content clears the floating Site Nav; pointer-events-none so it can't steal clicks. */}
							<div
								className="pointer-events-none [grid-area:header]"
								style={{ height: "var(--fd-nav-height)" }}
								aria-hidden="true"
							/>
							{/* Must stay under DocsLayout for SidebarContext (mobile trigger) */}
							<SiteNavDocs sidebarTrigger={<DocsSidebarTrigger />} />
						</>
					),
				}}
			>
				{children}
			</DocsLayout>
			<div className="site-footer-bleed">
				<div className="site-footer-band">
					<SiteFooter />
				</div>
			</div>
		</main>
	);
}
