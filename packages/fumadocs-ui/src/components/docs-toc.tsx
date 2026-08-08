"use client";

import { useTOCItems } from "fumadocs-ui/components/toc";
import {
	TOC,
	TOCPopover,
	TOCProvider,
} from "fumadocs-ui/layouts/docs/page/slots/toc";
import type { ComponentProps } from "react";

const tocColumnClassName =
	"sticky top-(--fd-docs-row-1) h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] flex flex-col [grid-area:toc] w-(--fd-toc-width) pt-12 pe-4 pb-2 xl:layout:[--fd-toc-width:268px] max-xl:hidden";

/**
 * TOC rail: keep the layout column when a footer exists, but hide the
 * "On this page" / "No Headings" chrome when the page has no headings.
 */
function DocsTOCMain(props: ComponentProps<typeof TOC>) {
	const items = useTOCItems();

	if (items.length === 0) {
		if (!props.footer && !props.header) {
			return (
				<div
					id="nd-toc"
					aria-hidden="true"
					className="sticky top-(--fd-docs-row-1) h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] [grid-area:toc] w-(--fd-toc-width) xl:layout:[--fd-toc-width:268px] max-xl:hidden"
				/>
			);
		}

		return (
			<div id="nd-toc" className={tocColumnClassName}>
				{props.header}
				{props.footer}
			</div>
		);
	}

	return <TOC {...props} />;
}

/**
 * Mobile TOC popover: drop the empty-state list chrome when there are no headings.
 * Footer actions (edit / feedback / star) still render.
 */
function DocsTOCPopover(props: ComponentProps<typeof TOCPopover>) {
	const items = useTOCItems();

	if (items.length === 0) {
		// Hide TOCItems' empty "No Headings" card; keep trigger + footer.
		return <TOCPopover {...props} list={{ ...props.list, className: "hidden" }} />;
	}

	return <TOCPopover {...props} />;
}

export const docsTocSlots = {
	provider: TOCProvider,
	main: DocsTOCMain,
	popover: DocsTOCPopover,
};
