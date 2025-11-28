"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";

export function InstallButton() {
	const pathname = usePathname();
	const isVitePluginPage = pathname?.includes("/docs/vite-plugin");
	const isBunPluginPage = pathname?.includes("/docs/bun-plugin");

	let href = "/docs/arkenv/quickstart#install";
	let label = "Install ArkEnv";

	if (isVitePluginPage) {
		href = "/docs/vite-plugin#installation";
		label = "Install ArkEnv for Vite";
	} else if (isBunPluginPage) {
		href = "/docs/bun-plugin#installation";
		label = "Install ArkEnv for Bun";
	}

	return (
		<Button asChild className="w-full cursor-pointer">
			<Link href={href}>
				<Download aria-hidden="true" />
				{label}
			</Link>
		</Button>
	);
}
