import "./aurora.css";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { CSSProperties, ReactNode } from "react";
import { HomeNav } from "./home-nav";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="home-aurora">
			<HomeLayout
				style={
					{
						paddingTop: 0,
						"--fd-nav-height": "0px",
						background: "transparent",
					} as CSSProperties
				}
				slots={{
					header: HomeNav,
				}}
			>
				{children}
			</HomeLayout>
		</div>
	);
}
