import "./globals.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "~/components/ui/toaster";
import { BASE_URL } from "~/config/constants";
import nextConfig from "~/next.config";

const inter = Inter({
	subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains-mono",
});

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={`${inter.className} ${jetbrainsMono.variable}`}
			suppressHydrationWarning
		>
			<body className="flex flex-col min-h-screen">
				<RootProvider
					search={{
						options: {
							api: `${BASE_URL}/api/search`,
						},
					}}
					theme={{
						enableColorScheme: true,
						enableSystem: true,
					}}
				>
					{children}
					<Toaster />
				</RootProvider>
			</body>
		</html>
	);
}
