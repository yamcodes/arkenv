"use client";

import { useTOCItems } from "fumadocs-ui/components/toc";
import {
	TOC,
	TOCPopover,
	TOCProvider,
} from "fumadocs-ui/layouts/docs/page/slots/toc";
import type { ComponentProps } from "react";

/** Keep the TOC grid column (layout spacing) even when a page has no headings. */
function DocsTOCMain(props: ComponentProps<typeof TOC>) {
	const items = useTOCItems();

	if (items.length === 0 && !props.footer && !props.header) {
		return (
			<div
				id="nd-toc"
				aria-hidden="true"
				className="sticky top-(--fd-docs-row-1) h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] [grid-area:toc] w-(--fd-toc-width) xl:layout:[--fd-toc-width:268px] max-xl:hidden"
			/>
		);
	}

	return <TOC {...props} />;
}

export const docsTocSlots = {
	provider: TOCProvider,
	main: DocsTOCMain,
	popover: TOCPopover,
};
