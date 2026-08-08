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
 * Fumadocs fetch search dialog — capsule radius matches Site Nav.
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

	return (
		<SearchDialog
			search={search}
			onSearchChange={setSearch}
			isLoading={query.isLoading}
			{...props}
		>
			<SearchDialogOverlay />
			<SearchDialogContent className="rounded-full">
				<SearchDialogHeader>
					<SearchDialogIcon />
					<SearchDialogInput />
					<SearchDialogClose />
				</SearchDialogHeader>
				<SearchDialogList items={query.data !== "empty" ? query.data : null} />
			</SearchDialogContent>
		</SearchDialog>
	);
}
