import "./global.css";
import { BASE_PATH } from "@/constants";
import { RootProvider } from "fumadocs-ui/provider";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({
	subsets: ["latin"],
});

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={inter.className} suppressHydrationWarning>
			<body className="flex flex-col min-h-screen">
				<RootProvider
					search={{
						options: {
							api: `${BASE_PATH}/api/search`,
						},
					}}
				>
					{children}
				</RootProvider>
			</body>
		</html>
	);
}
