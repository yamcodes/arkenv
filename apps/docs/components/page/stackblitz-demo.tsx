"use client";

import { useEffect, useRef } from "react";
import sdk from "@stackblitz/sdk";

export function StackBlitzDemo() {
	const embedRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!embedRef.current) return;
		sdk.embedGithubProject(
			embedRef.current,
			"yamcodes/ark.env/tree/stackblitz/examples/basic",
			{
				openFile: "index.ts",
				view: "editor",
				height: 600,
				hideExplorer: false,
				terminalHeight: 4,
				forceEmbedLayout: true,
				theme: "dark",
				showSidebar: true,
				hideNavigation: true,
			},
		);
	}, []);

	return (
		<div className="w-full rounded-lg overflow-hidden border border-fd-border shadow-lg min-h-[600px] relative mb-4">
			<div className="absolute inset-0" ref={embedRef} />
		</div>
	);
}
