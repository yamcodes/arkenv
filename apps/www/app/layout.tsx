import { Banner } from "~/components/banner";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "~/components/ui/toaster";

const geist = Geist({
	variable: "--font-sans",
	subsets: ["latin"],
});

const mono = Geist_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
});

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
			className={`${geist.variable} ${mono.variable}`}
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
