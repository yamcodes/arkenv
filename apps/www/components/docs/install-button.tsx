"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";
import { useIsFirstSession } from "~/hooks/use-is-first-session";

function useInstallContext(pathname: string | null) {
	if (
		pathname?.includes("/docs/guides/frameworks/vite") ||
		pathname?.includes("/docs/reference/vite-plugin")
	)
		return {
			key: "vite-plugin",
			href: "/docs/guides/frameworks/vite",
			label: "Install ArkEnv for Vite",
		};
	if (
		pathname?.includes("/docs/guides/frameworks/bun") ||
		pathname?.includes("/docs/reference/bun-plugin")
	)
		return {
			key: "bun-plugin",
			href: "/docs/guides/frameworks/bun",
			label: "Install ArkEnv for Bun",
		};
	return {
		key: "arkenv",
		href: "/docs/getting-started/installation",
		label: "Install ArkEnv",
	};
}

export function InstallButton() {
	const pathname = usePathname();
	const { key, href, label } = useInstallContext(pathname);
	const isFirstSession = useIsFirstSession(key);

	if (!isFirstSession) return null;

	return (
		<Button asChild className="w-full cursor-pointer">
			<Link href={href}>
				<Download aria-hidden="true" />
				{label}
			</Link>
		</Button>
	);
}
