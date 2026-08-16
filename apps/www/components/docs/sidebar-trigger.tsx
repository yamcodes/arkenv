"use client";

import { useDocsSidebar } from "@arkenv/fumadocs-ui/components";
import { PanelLeft } from "lucide-react";
import { useLayoutEffect, useSyncExternalStore } from "react";
import {
	getDocsSidebarOpen,
	registerDocsSidebar,
	subscribeDocsSidebar,
	toggleDocsSidebar,
} from "./sidebar-bridge";

/**
 * Headless — must stay under DocsLayout for SidebarContext.
 */
export function DocsSidebarSync() {
	const { open, setOpen } = useDocsSidebar();

	useLayoutEffect(() => {
		return registerDocsSidebar({ open, setOpen });
	}, [open, setOpen]);

	return null;
}

/**
 * Visible trigger — SSRs in Site Nav with the other header icons.
 */
export function DocsSidebarTrigger() {
	const open = useSyncExternalStore(
		subscribeDocsSidebar,
		getDocsSidebarOpen,
		() => false,
	);

	return (
		<button
			type="button"
			aria-label={open ? "Close Sidebar" : "Open Sidebar"}
			aria-expanded={open}
			className="flex items-center justify-center size-8 rounded-md text-fd-foreground hover:text-fd-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
			onClick={toggleDocsSidebar}
		>
			<PanelLeft className="size-5" />
		</button>
	);
}
