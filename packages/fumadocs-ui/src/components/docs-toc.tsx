"use client";

import type { TOCItemType } from "fumadocs-core/toc";
import { useTOCItems } from "fumadocs-ui/components/toc";
import { I18nLabel } from "fumadocs-ui/contexts/i18n";
import {
	TOCPopover,
	type TOCProps,
	TOCProvider,
} from "fumadocs-ui/layouts/docs/page/slots/toc";
import { Text } from "lucide-react";
import {
	type ComponentProps,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { cn } from "@/utils/cn";
import { tocItemId } from "./heading-spy";
import { useHeadingSpy } from "./use-heading-spy";

const tocColumnClassName =
	"sticky top-(--fd-docs-row-1) h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] flex flex-col [grid-area:toc] w-(--fd-toc-width) pt-12 pe-4 pb-2 min-[1200px]:layout:[--fd-toc-width:268px] max-[1199px]:hidden";

function scrollChildIntoContainer(container: HTMLElement, child: HTMLElement) {
	const containerRect = container.getBoundingClientRect();
	const childRect = child.getBoundingClientRect();
	if (childRect.top < containerRect.top) {
		container.scrollTop -= containerRect.top - childRect.top;
	} else if (childRect.bottom > containerRect.bottom) {
		container.scrollTop += childRect.bottom - containerRect.bottom;
	}
}

function DocsTOCItems({ className, ...props }: ComponentProps<"div">) {
	const items = useTOCItems();
	const { activeId, onTocClick } = useHeadingSpy(items);
	const listRef = useRef<HTMLDivElement>(null);
	const [track, setTrack] = useState<{ top: string; bottom: string } | null>(
		null,
	);

	const updateTrack = useCallback(() => {
		const list = listRef.current;
		if (!list || !activeId) {
			setTrack(null);
			return;
		}
		const link = list.querySelector<HTMLElement>(`a[href="#${activeId}"]`);
		if (!link) {
			setTrack(null);
			return;
		}
		const styles = getComputedStyle(link);
		const top = link.offsetTop + Number.parseFloat(styles.paddingTop);
		const bottom =
			link.offsetTop +
			link.clientHeight -
			Number.parseFloat(styles.paddingBottom);
		setTrack({ top: `${top}px`, bottom: `${bottom}px` });
	}, [activeId]);

	useLayoutEffect(() => {
		if (items.length === 0) return;
		updateTrack();
		const list = listRef.current;
		if (!list) return;
		const observer = new ResizeObserver(updateTrack);
		observer.observe(list);
		return () => observer.disconnect();
	}, [updateTrack, items]);

	useEffect(() => {
		const list = listRef.current;
		if (!list || !activeId) return;
		const link = list.querySelector<HTMLElement>(`a[href="#${activeId}"]`);
		if (link) scrollChildIntoContainer(list, link);
	}, [activeId]);

	return (
		<div className="relative min-h-0 text-sm ms-px overflow-auto [scrollbar-width:none] mask-[linear-gradient(to_bottom,transparent,white_16px,white_calc(100%-16px),transparent)] py-3">
			<div className="relative">
				{track && (
					<div
						className="absolute inset-y-0 inset-s-0 bg-fd-primary w-px transition-[clip-path]"
						style={{
							clipPath: `polygon(0 ${track.top}, 100% ${track.top}, 100% ${track.bottom}, 0 ${track.bottom})`,
						}}
					/>
				)}
				<div
					{...props}
					ref={listRef}
					className={cn(
						"flex flex-col border-s border-fd-foreground/10",
						className,
					)}
				>
					{items.map((item) => (
						<DocsTOCLink
							key={item.url}
							item={item}
							active={tocItemId(item.url) === activeId}
							onTocClick={onTocClick}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function DocsTOCLink({
	item,
	active,
	onTocClick,
}: {
	item: TOCItemType;
	active: boolean;
	onTocClick: (id: string) => void;
}) {
	const id = tocItemId(item.url);
	return (
		<a
			href={item.url}
			data-active={active ? "true" : undefined}
			onClick={() => {
				if (id) onTocClick(id);
			}}
			className={cn(
				"prose py-1.5 text-sm text-fd-muted-foreground scroll-m-4 transition-colors wrap-anywhere first:pt-0 last:pb-0 data-[active=true]:text-fd-primary hover:text-fd-accent-foreground",
				item.depth <= 2 && "ps-3",
				item.depth === 3 && "ps-6",
				item.depth >= 4 && "ps-8",
			)}
		>
			{item.title}
		</a>
	);
}

/**
 * TOC rail: keep the layout column when a footer exists, but hide the
 * "On this page" / "No Headings" chrome when the page has no headings.
 * End padding is set in theme.css to match the Site Nav gutter.
 *
 * Active heading uses a spy line at each heading's scroll-margin (Site Nav
 * offset), not Fumadocs' 90% IntersectionObserver — that skipped the heading
 * at the top of the viewport whenever a later heading was fully on screen.
 */
function DocsTOCMain({ container, header, footer, list }: TOCProps) {
	const items = useTOCItems();

	if (items.length === 0) {
		if (!header && !footer) {
			return (
				<div
					id="nd-toc"
					aria-hidden="true"
					className="sticky top-(--fd-docs-row-1) h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] [grid-area:toc] w-(--fd-toc-width) min-[1200px]:layout:[--fd-toc-width:268px] max-[1199px]:hidden"
				/>
			);
		}

		return (
			<div id="nd-toc" className={tocColumnClassName}>
				{header}
				{footer}
			</div>
		);
	}

	return (
		<div
			id="nd-toc"
			{...container}
			className={cn(tocColumnClassName, container?.className)}
		>
			{header}
			<h3
				id="toc-title"
				className="inline-flex items-center gap-1.5 text-sm text-fd-muted-foreground"
			>
				<Text className="size-4" />
				<I18nLabel label="toc" />
			</h3>
			<DocsTOCItems {...list} />
			{footer}
		</div>
	);
}

/**
 * Mobile TOC popover: drop the empty-state list chrome when there are no headings.
 * Footer actions (edit / feedback / star) still render.
 */
function DocsTOCPopover(props: ComponentProps<typeof TOCPopover>) {
	const items = useTOCItems();

	if (items.length === 0) {
		// Hide TOCItems' empty "No Headings" card; keep trigger + footer.
		return (
			<TOCPopover {...props} list={{ ...props.list, className: "hidden" }} />
		);
	}

	return <TOCPopover {...props} />;
}

export const docsTocSlots = {
	provider: TOCProvider,
	main: DocsTOCMain,
	popover: DocsTOCPopover,
};
