"use client";

import { useEffect } from "react";

/**
 * Open-slide–style scroll reveals: only hide `[data-reveal]` nodes still
 * below the fold, then clear blur/opacity via IntersectionObserver.
 * No-JS and above-the-fold content stay visible (no flash).
 *
 * Do not clear `.reveal-hidden` on effect cleanup — React Strict Mode would
 * flash content visible, then re-hide and animate again (double fade).
 */
export function ScrollReveal() {
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}

		const els = Array.from(
			document.querySelectorAll<HTMLElement>("[data-reveal]"),
		);
		const foldLine = window.innerHeight * 0.92;
		const pending = els.filter((el) => {
			if (el.dataset.revealShown === "1") return false;
			return el.getBoundingClientRect().top > foldLine;
		});
		if (pending.length === 0) return;

		for (const el of pending) el.classList.add("reveal-hidden");

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const el = entry.target as HTMLElement;
					el.dataset.revealShown = "1";
					el.classList.add("reveal-shown");
					el.classList.remove("reveal-hidden");
					observer.unobserve(el);
				}
			},
			{ rootMargin: "0px 0px -8% 0px" },
		);

		for (const el of pending) observer.observe(el);

		return () => {
			observer.disconnect();
		};
	}, []);

	return null;
}
