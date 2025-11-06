import { Banner } from "fumadocs-ui/components/banner";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "~/components/ui/toaster";

const inter = Inter({
	subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
	icons: {
		icon: [
			{
				url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sailboat"><style>@media (prefers-color-scheme:dark){svg{stroke:%23ffffff}}</style><path d="M22 18H2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4Z"/><path d="M21 14 10 2 3 14h18Z"/><path d="M10 2v16"/></svg>',
				type: "image/svg+xml",
			},
		],
	},
};

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={`${inter.className} ${jetbrainsMono.variable}`}
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
					<Banner variant="rainbow" id="arktype-feature-banner">
						🎉 We are now featured on&nbsp;
						<a
							href="https://arktype.io/docs/ecosystem#arkenv"
							target="_blank"
							rel="noopener noreferrer"
							className="underline underline-offset-2 hover:text-blue-500"
						>
							arktype.io
						</a>
						!
					</Banner>
					{children}
					<SpeedInsights />
					<Analytics />
					<Toaster />
				</RootProvider>
			</body>
		</html>
	);
}
