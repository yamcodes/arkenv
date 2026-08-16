"use client";

import { useDocsSidebar } from "@arkenv/fumadocs-ui/components";
import { PanelLeft } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SITE_NAV_SIDEBAR_SLOT_ID } from "~/components/site-nav";

export function DocsSidebarTrigger() {
	const { open, setOpen } = useDocsSidebar();
	const [slot, setSlot] = useState<HTMLElement | null>(null);

	useLayoutEffect(() => {
		setSlot(document.getElementById(SITE_NAV_SIDEBAR_SLOT_ID));
	}, []);

	if (!slot) return null;

	return createPortal(
		<button
			type="button"
			aria-label={open ? "Close Sidebar" : "Open Sidebar"}
			aria-expanded={open}
			className="flex items-center justify-center size-8 rounded-md text-fd-foreground hover:text-fd-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
			onClick={() => setOpen(!open)}
		>
			<PanelLeft className="size-5" />
		</button>,
		slot,
	);
}
