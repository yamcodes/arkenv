import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { isExternalUrl, type Url } from "~/lib/utils/url";
import { NewBadge } from "./ui/new-badge";

export function AnnouncementBadge({
	arrow = true,
	new: newBadge = true,
	href,
	children,
}: PropsWithChildren<{
	// TODO: we can detect the arrow kind (right facing, or top right facing) based on whether `href` is internal or external
	/**
	 * Show an arrow next to the badge
	 */
	arrow?: boolean;
	/**
	 * Show the "New" icon next to the badge
	 */
	new?: boolean;
	/**
	 * The link to navigate to when clicking the badge.
	 */
	href: Url;
}>) {
	return (
		<Link
			href={href}
			data-no-underline
			className="group relative flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-1 py-1 text-sm font-medium text-blue-900 transition-all hover:bg-blue-500/10 dark:text-blue-200 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-blue-500/30"
		>
			{newBadge && (
				<NewBadge className="h-5 font-semibold bg-blue-500/10 text-blue-700 border-blue-500/10 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/20 shadow-none hover:bg-blue-500/20 transition-colors" />
			)}
			<span className="flex items-center gap-1 mr-1">
				{children}
				{arrow &&
					href &&
					(isExternalUrl(href.toString()) ? (
						<ArrowUpRight className="h-4 w-4 opacity-40 transition-all group-hover:opacity-100" />
					) : (
						<ArrowRight className="h-4 w-4 mr-0.5 opacity-40 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
					))}
			</span>
		</Link>
	);
}
