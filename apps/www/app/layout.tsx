import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistMono } from "geist/font/mono";
import { GeistPixelGrid } from "geist/font/pixel";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppRootProvider } from "~/components/providers/app-root-provider";
import { Toaster } from "~/components/ui/toaster";

export const metadata: Metadata = {
	metadataBase: new URL("https://arkenv.js.org"),
	icons: {
		icon: [
			{
				url: "/assets/icon.svg",
				type: "image/svg+xml",
			},
		],
	},
	openGraph: {
		siteName: "ArkEnv",
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
	},
};

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={`${GeistSans.className} ${GeistSans.variable} ${GeistMono.variable} ${GeistPixelGrid.variable}`}
			suppressHydrationWarning
			data-scroll-behavior="smooth"
		>
			<body className="flex flex-col min-h-screen">
				<AppRootProvider>
					{children}
					<SpeedInsights />
					<Analytics />
					<Toaster />
				</AppRootProvider>
			</body>
		</html>
	);
}
