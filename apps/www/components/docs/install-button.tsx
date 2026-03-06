"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

const STORAGE_KEY = "arkenv-doc-sessions";

export function InstallButton() {
	const pathname = usePathname();
	// null = not yet determined (SSR), true = show, false = hide
	const [visible, setVisible] = useState<boolean | null>(null);

	useEffect(() => {
		const raw = localStorage.getItem(STORAGE_KEY);
		const sessions = raw ? Number(raw) : 0;
		const next = sessions + 1;
		localStorage.setItem(STORAGE_KEY, String(next));
		setVisible(next < 2);
	}, []);

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

	if (!visible) return null;

	return (
		<Button asChild className="w-full cursor-pointer">
			<Link href={href}>
				<Download aria-hidden="true" />
				{label}
			</Link>
		</Button>
	);
}
