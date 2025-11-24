"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";

export function InstallButton() {
	const pathname = usePathname();
	const isVitePluginPage = pathname?.includes("/docs/vite-plugin");

	return (
		<Button asChild className="w-full cursor-pointer">
			<Link
				href={
					isVitePluginPage
						? "/docs/vite-plugin#installation"
						: "/docs/arkenv/quickstart#install"
				}
			>
				<Download aria-hidden="true" />
				{isVitePluginPage ? "Install ArkEnv Vite plugin" : "Install ArkEnv"}
			</Link>
		</Button>
	);
}
