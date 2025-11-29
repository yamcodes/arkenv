import { Banner } from "~/components/banner";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "~/components/ui/toaster";

export const metadata: Metadata = {
	icons: {
		icon: [
			{
				url: "/assets/Japanese_Map_symbol_(Lighthouse).svg",
				type: "image/svg+xml",
			},
		],
	},
};

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={`${GeistSans.variable} ${GeistMono.variable}`}
			suppressHydrationWarning
			data-scroll-behavior="smooth"
		>
			<body className="flex flex-col min-h-screen">
				<RootProvider
					search={{
						options: {
							api: "/api/search",
						},
					}}
					theme={{
						enableColorScheme: true,
						enableSystem: true,
					}}
				>
					<Banner />
					{children}
					<SpeedInsights />
					<Analytics />
					<Toaster />
				</RootProvider>
			</body>
		</html>
	);
}
