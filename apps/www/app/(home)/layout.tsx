import "./aurora.css";
import type { ReactNode } from "react";
import { DotGrid, ScrollReveal } from "~/components/page";
import { SiteNavHome } from "~/components/site-nav";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="home-aurora">
			<div className="home-aurora__atmosphere" aria-hidden="true">
				<DotGrid />
			</div>
			<ScrollReveal />
			<main className="flex flex-1 flex-col">
				<SiteNavHome />
				{children}
			</main>
		</div>
	);
}
