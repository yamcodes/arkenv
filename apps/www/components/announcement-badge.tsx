import { type ArkenvUrl, isExternalUrl } from "@arkenv/fumadocs-ui/utils";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { NewBadge } from "./ui/new-badge";

export function AnnouncementBadge({
	arrow = true,
	new: newBadge = false,
	href,
	children,
}: PropsWithChildren<{
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
	href: ArkenvUrl;
}>) {
	return (
		<Link
			href={href}
			data-no-underline
			className="home-aurora__announce"
		>
			{newBadge ? (
				<NewBadge className="home-aurora__announce-new" />
			) : null}
			<span
				className={`home-aurora__announce-label${!newBadge ? " home-aurora__announce-label--solo" : ""}`}
			>
				{children}
				{arrow &&
					href &&
					(isExternalUrl(href) ? (
						<ArrowUpRight className="home-aurora__announce-arrow" />
					) : (
						<ArrowRight className="home-aurora__announce-arrow home-aurora__announce-arrow--right" />
					))}
			</span>
		</Link>
	);
}
