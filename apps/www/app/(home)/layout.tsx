import "./aurora.css";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { CSSProperties, ReactNode } from "react";
import { DotGrid, HeroMotion, ScrollReveal } from "~/components/page";
import { SiteNavHome } from "~/components/site-nav";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="home-aurora">
			<div className="home-aurora__atmosphere" aria-hidden="true">
				<DotGrid />
			</div>
			<HeroMotion />
			<ScrollReveal />
			<HomeLayout
				style={
					{
						paddingTop: 0,
						"--fd-nav-height": "0px",
						"--fd-layout-width": "1400px",
						background: "transparent",
					} as CSSProperties
				}
				slots={{
					header: SiteNavHome,
				}}
			>
				{children}
			</HomeLayout>
		</div>
	);
}
