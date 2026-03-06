"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Search } from "lucide-react";

export function SearchToggle() {
	const { setOpenSearch } = useSearchContext();

	return (
		<button
			type="button"
			aria-label="Open Search"
			onClick={() => setOpenSearch(true)}
			className="flex items-center justify-center h-8 w-8 text-fd-muted-foreground hover:text-fd-foreground transition-colors"
		>
			<Search className="size-5" />
		</button>
	);
}
