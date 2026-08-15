"use client";

import { useDocsSidebar } from "@arkenv/fumadocs-ui/components";
import { PanelLeft } from "lucide-react";

export function DocsSidebarTrigger() {
	const { open, setOpen } = useDocsSidebar();
	return (
		<button
			type="button"
			aria-label={open ? "Close Sidebar" : "Open Sidebar"}
			aria-expanded={open}
			className="flex items-center justify-center size-8 rounded-md text-fd-foreground hover:text-fd-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
			onClick={() => setOpen(!open)}
		>
			<PanelLeft className="size-5" />
		</button>
	);
}
