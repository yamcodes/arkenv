"use client";

import { useMediaQuery } from "fumadocs-core/utils/use-media-query";
import {
	SidebarProvider as FumadocsSidebarProvider,
	type SidebarProviderProps,
} from "fumadocs-ui/layouts/docs/slots/sidebar";
import { usePathname } from "next/navigation";
import { createContext, use, useEffect, useMemo, useState } from "react";

/**
 * Turbo/geistdocs docs chrome cutoff: iPad Air (~820px) stays mobile,
 * iPad Pro 12.9" (1024px) keeps the sidebar.
 */
export const DOCS_DESKTOP_MIN_WIDTH_PX = 960;

type DocsSidebarContextValue = {
	open: boolean;
	setOpen: (open: boolean) => void;
	collapsed: boolean;
	mode: "drawer" | "full";
};

const DocsSidebarContext = createContext<DocsSidebarContextValue | null>(null);

/**
 * Fumadocs' own provider still uses 768px for its primitives. This wrapper
 * adds a 960px drawer/sidebar mode for ArkEnv chrome (Copy, trigger, grid).
 */
export function DocsSidebarProvider({
	children,
	...props
}: SidebarProviderProps) {
	const [open, setOpen] = useState(false);
	const isDrawer =
		useMediaQuery(`(width < ${DOCS_DESKTOP_MIN_WIDTH_PX}px)`) === true;
	const pathname = usePathname();

	useEffect(() => {
		if (pathname) setOpen(false);
	}, [pathname]);

	const value = useMemo(
		() => ({
			open,
			setOpen,
			collapsed: false,
			mode: (isDrawer ? "drawer" : "full") as "drawer" | "full",
		}),
		[open, isDrawer],
	);

	return (
		<DocsSidebarContext.Provider value={value}>
			<FumadocsSidebarProvider {...props}>{children}</FumadocsSidebarProvider>
		</DocsSidebarContext.Provider>
	);
}

export function useDocsSidebar(): DocsSidebarContextValue {
	const ctx = use(DocsSidebarContext);
	if (!ctx) {
		throw new Error(
			"Missing DocsSidebarProvider; wrap the docs layout sidebar slot.",
		);
	}
	return ctx;
}
