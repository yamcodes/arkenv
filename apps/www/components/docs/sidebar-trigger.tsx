"use client";

import { SidebarTrigger } from "fumadocs-ui/components/sidebar/base";
import { PanelLeft } from "lucide-react";

export function DocsSidebarTrigger() {
	return (
		<SidebarTrigger className="md:hidden flex items-center justify-center size-8 rounded-md text-fd-muted-foreground hover:text-fd-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-fd-ring">
			<PanelLeft className="size-5" />
		</SidebarTrigger>
	);
}
