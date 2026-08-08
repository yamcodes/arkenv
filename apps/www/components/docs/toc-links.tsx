"use client";

import { CircleArrowUp, Pencil } from "lucide-react";
import { DocsFeedbackButton } from "~/components/docs/docs-feedback";
import { DocsStarCard } from "~/components/docs/docs-star-card";

/**
 * TOC page actions: scroll / edit / feedback + Star on GitHub card.
 * Passed as `tableOfContent.footer` / popover footer.
 */
export function DocsTocLinks({
	pageTitle,
	editHref,
}: {
	pageTitle: string;
	editHref: string;
}) {
	return (
		<div className="mt-6 flex flex-col gap-3 border-t border-fd-border pt-4 first:mt-0 first:border-t-0 first:pt-0">
			<nav
				aria-label="Page actions"
				className="flex flex-col gap-2 text-sm text-fd-muted-foreground"
			>
				<button
					type="button"
					onClick={() => {
						window.scrollTo({ top: 0, behavior: "smooth" });
					}}
					className="inline-flex items-center gap-2 text-left hover:text-fd-foreground transition-colors"
				>
					<CircleArrowUp aria-hidden="true" className="size-3.5 shrink-0" />
					Scroll to top
				</button>
				<a
					href={editHref}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-2 hover:text-fd-foreground transition-colors"
				>
					<Pencil aria-hidden="true" className="size-3.5 shrink-0" />
					Edit this page
				</a>
				<DocsFeedbackButton pageTitle={pageTitle} />
			</nav>

			<DocsStarCard />
		</div>
	);
}
