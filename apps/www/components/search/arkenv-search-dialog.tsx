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

type Props = SharedProps & {
	api?: string;
	delayMs?: number;
	type?: "fetch" | "static";
};

/**
 * Fumadocs fetch search dialog — overlays Site Nav on mobile (same inset /
 * gutter / bar height; see theme.css).
 *
 * Radius is `--radius-control` on `.arkenv-search-dialog` in theme.css so
 * the overlay matches the navbar search trigger, not a pill.
 * Fumadocs `overflow-hidden` clips the list to that same radius.
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

	return (
		<SearchDialog
			search={search}
			onSearchChange={setSearch}
			isLoading={query.isLoading}
			{...props}
		>
			<SearchDialogOverlay />
			<SearchDialogContent className="arkenv-search-dialog">
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
