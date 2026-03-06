"use client";

import { useI18n } from "fumadocs-ui/contexts/i18n";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Search } from "lucide-react";

export function SearchToggle() {
	const { setOpenSearch, hotKey } = useSearchContext();
	const { text } = useI18n();

	return (
		<button
			type="button"
			aria-label="Open Search"
			data-search-full=""
			onClick={() => setOpenSearch(true)}
			className="hidden md:inline-flex items-center gap-2 rounded-lg border bg-fd-secondary/50 px-3 py-1.5 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground h-9 min-w-40"
		>
			<Search className="size-4 shrink-0" />
			<span className="flex-1 text-start">{text.search}</span>
			<span className="inline-flex gap-0.5">
				{hotKey.map((k, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static hotkey list
					<kbd
						key={i}
						className="rounded border bg-fd-background px-1.5 font-sans text-xs"
					>
						{k.display}
					</kbd>
				))}
			</span>
		</button>
	);
}
