"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Search } from "lucide-react";

function getModifierKey() {
	if (typeof window === "undefined") return "Ctrl";
	return window.navigator.userAgent.includes("Mac") ? "⌘" : "Ctrl";
}

export function SearchToggle() {
	const { setOpenSearch } = useSearchContext();
	const modifier = getModifierKey();

	return (
		<>
			{/* Mobile: icon-only ghost button */}
			<button
				type="button"
				aria-label="Open Search"
				data-search=""
				onClick={() => setOpenSearch(true)}
				className="md:hidden inline-flex items-center justify-center size-8 rounded-md text-fd-foreground hover:text-fd-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
			>
				<Search className="size-4" />
			</button>

			{/* Desktop: full search bar */}
			<button
				type="button"
				aria-label="Open Search"
				data-search-full=""
				onClick={() => setOpenSearch(true)}
				className="hidden md:inline-flex items-center gap-2 rounded-lg border bg-fd-secondary/50 px-3 py-2 text-base text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground min-w-40"
			>
				<Search className="size-4 shrink-0" />
				<span className="flex-1 text-start">Search</span>
				<span className="inline-flex gap-0.5" suppressHydrationWarning>
					<kbd className="rounded border bg-fd-background px-1.5 font-sans text-xs">
						{modifier}
					</kbd>
					<kbd className="rounded border bg-fd-background px-1.5 font-sans text-xs">
						K
					</kbd>
				</span>
			</button>
		</>
	);
}
