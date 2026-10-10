"use client";

import { useEffect } from "react";

/**
 * Open-slide–style scroll reveals: only hide `[data-reveal]` nodes still
 * below the fold, then clear blur/opacity via IntersectionObserver.
 * No-JS and above-the-fold content stay visible (no flash).
 *
 * Do not clear `.reveal-hidden` on effect cleanup — React Strict Mode would
 * flash content visible, then re-hide and animate again (double fade).
 *
 * Pointer events stay off until the opacity transition ends (`.reveal-settled`).
 * The fade delay leaves a stable, still-transparent box. A click there focuses
 * the link and does not navigate.
 */
export function ScrollReveal() {
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}

		const els = Array.from(
			document.querySelectorAll<HTMLElement>("[data-reveal]"),
		);
		const disarms: Array<() => void> = [];

		// Strict Mode cleanup cancels the settle timer. Re-arm anything already
		// showing that has not settled yet.
		const showing = els.filter(
			(el) =>
				el.dataset.revealShown === "1" &&
				!el.classList.contains("reveal-settled"),
		);
		for (const el of showing) disarms.push(armReveal(el));

		const pending = els.filter((el) => el.dataset.revealShown !== "1");
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
					disarms.push(armReveal(el));
				}
			},
			{ rootMargin: "0px 0px -24px 0px" },
		);

		for (const el of pending) observer.observe(el);

		return () => {
			observer.disconnect();
			for (const disarm of disarms) disarm();
		};
	}, []);

	return null;
}

function cssListMaxMs(value: string): number {
	let max = 0;
	for (const part of value.split(",")) {
		const token = part.trim();
		if (!token) continue;
		const amount = Number.parseFloat(token);
		if (!Number.isFinite(amount)) continue;
		const ms = token.endsWith("ms") ? amount : amount * 1000;
		if (ms > max) max = ms;
	}
	return max;
}

/** Duration plus delay of the reveal transition, in milliseconds. */
function revealWaitMs(el: HTMLElement): number {
	const style = getComputedStyle(el);
	return (
		cssListMaxMs(style.transitionDuration) + cssListMaxMs(style.transitionDelay)
	);
}

function armReveal(el: HTMLElement): () => void {
	if (el.classList.contains("reveal-settled")) return () => {};

	const settle = () => {
		el.classList.add("reveal-settled");
	};

	const wait = revealWaitMs(el);
	if (wait === 0) {
		settle();
		return () => {};
	}

	const onEnd = (event: TransitionEvent) => {
		if (event.target !== el || event.propertyName !== "opacity") return;
		el.removeEventListener("transitionend", onEnd);
		settle();
	};
	el.addEventListener("transitionend", onEnd);
	const timer = window.setTimeout(settle, wait + 50);
	return () => {
		el.removeEventListener("transitionend", onEnd);
		window.clearTimeout(timer);
	};
}
