"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

function useModifierKey() {
	const [modifier, setModifier] = useState<string | null>(null);

	useEffect(() => {
		const ua = window.navigator.userAgent;
		setModifier(ua.includes("Mac") ? "⌘" : "Ctrl");
	}, []);

	return modifier;
}

export function SearchToggle() {
	const { setOpenSearch } = useSearchContext();
	const modifier = useModifierKey();

	return (
		<button
			type="button"
			aria-label="Open Search"
			data-search-full=""
			onClick={() => setOpenSearch(true)}
			className="hidden md:inline-flex items-center gap-2 rounded-lg border bg-fd-secondary/50 px-3 py-2 text-base text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground min-w-40"
		>
			<Search className="size-4 shrink-0" />
			<span className="flex-1 text-start">Search</span>
			{modifier && (
				<span className="inline-flex gap-0.5">
					<kbd className="rounded border bg-fd-background px-1.5 font-sans text-xs">
						{modifier}
					</kbd>
					<kbd className="rounded border bg-fd-background px-1.5 font-sans text-xs">
						K
					</kbd>
				</span>
			)}
		</button>
	);
}
