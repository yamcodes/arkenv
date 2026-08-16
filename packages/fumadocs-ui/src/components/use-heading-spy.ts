"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
	getActiveHeadingId,
	type HeadingPosition,
	tocItemId,
} from "./heading-spy";

/** Subpixel slack so a heading parked on its scroll-margin still counts. */
const SPY_SLACK_PX = 1;
const LOCK_TIMEOUT_MS = 500;

type TocUrlItem = {
	url: string;
};

function measureActiveId(items: readonly TocUrlItem[]): string | undefined {
	const headings: HeadingPosition[] = [];
	let spyOffset = 128; // fallback: --fd-nav-height (~5.5rem) + --fd-page-pad-top (2.5rem)
	let readOffset = false;
	for (const item of items) {
		const id = tocItemId(item.url);
		if (!id) continue;
		const element = document.getElementById(id);
		if (!element) continue;
		if (!readOffset) {
			const margin = Number.parseFloat(
				getComputedStyle(element).scrollMarginTop,
			);
			if (Number.isFinite(margin) && margin > 0) spyOffset = margin;
			readOffset = true;
		}
		headings.push({ id, top: element.getBoundingClientRect().top });
	}
	return getActiveHeadingId(headings, spyOffset + SPY_SLACK_PX);
}

/**
 * Active TOC heading: last heading at or above the heading scroll-margin.
 * Clicks lock that id until scroll settles so in-flight scroll cannot skip ahead.
 */
export function useHeadingSpy(items: readonly TocUrlItem[]): {
	activeId: string | undefined;
	onTocClick: (id: string) => void;
} {
	const itemsRef = useRef(items);
	itemsRef.current = items;
	const lockedIdRef = useRef<string | null>(null);
	const lockGenRef = useRef(0);
	const lockTimeoutRef = useRef<number>(0);
	const [activeId, setActiveId] = useState<string | undefined>(() => {
		const first = items[0] ? tocItemId(items[0].url) : null;
		return first ?? undefined;
	});

	const sync = useCallback(() => {
		if (lockedIdRef.current) {
			setActiveId(lockedIdRef.current);
			return;
		}
		setActiveId(measureActiveId(itemsRef.current));
	}, []);

	useLayoutEffect(() => {
		lockedIdRef.current = null;
		setActiveId(measureActiveId(items));

		let frame = 0;
		const onScrollOrResize = () => {
			if (frame) return;
			frame = window.requestAnimationFrame(() => {
				frame = 0;
				sync();
			});
		};

		window.addEventListener("scroll", onScrollOrResize, {
			passive: true,
			capture: true,
		});
		window.addEventListener("resize", onScrollOrResize);
		window.addEventListener("hashchange", sync);
		return () => {
			if (frame) window.cancelAnimationFrame(frame);
			window.clearTimeout(lockTimeoutRef.current);
			window.removeEventListener("scroll", onScrollOrResize, true);
			window.removeEventListener("resize", onScrollOrResize);
			window.removeEventListener("hashchange", sync);
		};
	}, [items, sync]);

	const onTocClick = useCallback(
		(id: string) => {
			const gen = ++lockGenRef.current;
			lockedIdRef.current = id;
			setActiveId(id);

			const unlock = () => {
				if (lockGenRef.current !== gen) return;
				lockedIdRef.current = null;
				sync();
			};

			const onScrollEnd = () => {
				window.clearTimeout(lockTimeoutRef.current);
				unlock();
			};
			window.addEventListener("scrollend", onScrollEnd, { once: true });
			window.clearTimeout(lockTimeoutRef.current);
			lockTimeoutRef.current = window.setTimeout(() => {
				window.removeEventListener("scrollend", onScrollEnd);
				unlock();
			}, LOCK_TIMEOUT_MS);
		},
		[sync],
	);

	return { activeId, onTocClick };
}
