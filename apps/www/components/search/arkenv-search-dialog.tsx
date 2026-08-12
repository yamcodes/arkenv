"use client";

import { useDocsSearch } from "fumadocs-core/search/client";
import {
	SearchDialog,
	SearchDialogClose,
	SearchDialogContent,
	SearchDialogHeader,
	SearchDialogIcon,
	SearchDialogInput,
	SearchDialogList,
	SearchDialogOverlay,
} from "fumadocs-ui/components/dialog/search";
import { useI18n } from "fumadocs-ui/contexts/i18n";
import type { SharedProps } from "fumadocs-ui/contexts/search";
import { cn } from "~/lib/utils";

type Props = SharedProps & {
	api?: string;
	delayMs?: number;
	type?: "fetch" | "static";
};

/**
 * Fumadocs fetch search dialog — capsule overlays Site Nav on mobile
 * (same inset / gutter / bar height; see theme.css).
 *
 * Keep full-pill radius only while the results list is collapsed. Fumadocs
 * `SearchDialogContent` uses `overflow-hidden`; `rounded-full` on a tall
 * panel clips titles and excerpts into a circular mask.
 */
export default function ArkenvSearchDialog({
	api,
	delayMs,
	type = "fetch",
	...props
}: Props) {
	const { locale } = useI18n();
	const { search, setSearch, query } = useDocsSearch(
		type === "fetch"
			? { type: "fetch", api, locale, delayMs }
			: { type: "static", from: api, locale, delayMs },
	);
	const items = query.data !== "empty" ? query.data : null;
	const resultsOpen = Array.isArray(items);

	return (
		<SearchDialog
			search={search}
			onSearchChange={setSearch}
			isLoading={query.isLoading}
			{...props}
		>
			<SearchDialogOverlay />
			{/* Capsule overlays Site Nav on mobile — see theme.css search dialog rules */}
			<SearchDialogContent
				className={cn(
					"arkenv-search-dialog",
					resultsOpen ? "rounded-2xl" : "rounded-full",
				)}
			>
				<SearchDialogHeader className="arkenv-search-dialog__bar">
					<SearchDialogIcon />
					<SearchDialogInput />
					<SearchDialogClose />
				</SearchDialogHeader>
				<SearchDialogList items={items} />
			</SearchDialogContent>
		</SearchDialog>
	);
}
