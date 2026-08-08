"use client";

import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import ArkenvSearchDialog from "~/components/search/arkenv-search-dialog";

/**
 * Client RootProvider so theme `scriptProps` can differ between SSR and
 * hydration. next-themes injects a FOUC `<script>`; React 19 warns when that
 * tag is reconciled on the client. Keep JS on the server (runs in HTML), mark
 * it as a data block on the client (script already ran; suppresses the warn).
 */
export function AppRootProvider({ children }: { children: ReactNode }) {
	return (
		<RootProvider
			search={{
				SearchDialog: ArkenvSearchDialog,
				options: {
					api: "/api/search",
				},
			}}
			theme={{
				enableColorScheme: true,
				enableSystem: true,
				defaultTheme: "dark",
				themes: ["system", "light", "dark"],
				scriptProps:
					typeof window === "undefined"
						? undefined
						: { type: "application/json" },
			}}
		>
			{children}
		</RootProvider>
	);
}
