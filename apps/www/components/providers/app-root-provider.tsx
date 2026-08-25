"use client";

import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import ArkenvSearchDialog from "~/components/search/arkenv-search-dialog";

/**
 * Client RootProvider so theme `scriptProps` can differ between SSR and
 * hydration. next-themes injects a FOUC `<script>`; React 19 warns when that
 * tag is reconciled on the client. Keep JS on the server (runs in HTML), mark
 * it as a data block on the client (script already ran; suppresses the warn).
 *
 * Light/system themes are disabled while the PostHog `theme-toggle` flag is
 * off — force dark so stored localStorage / prefers-color-scheme cannot flip
 * the site to light. When re-enabling the toggle, drop `forcedTheme` and
 * restore `enableSystem` + the light/system theme entries.
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
				enableSystem: false,
				defaultTheme: "dark",
				forcedTheme: "dark",
				themes: ["dark"],
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
