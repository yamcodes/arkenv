"use client";

import { useEffect, useRef, useState } from "react";

export const HERO_HEADLINE_NAMES = [
	"ArkType",
	"Zod",
	"Valibot",
	"Standard Schema",
] as const;

/** Dwell on each name. Cycle is independent of the example tabs, so 3s not 3.5s. */
export const HERO_DWELL_MS = 3000;
export const HERO_FIRST_DWELL_MS = HERO_DWELL_MS;
export const HERO_CYCLE_MS = HERO_DWELL_MS;

function prefersReducedMotion() {
	return (
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
	);
}

function nextIndex(current: number) {
	return (current + 1) % HERO_HEADLINE_NAMES.length;
}

function pauseRegions() {
	return [
		document.getElementById("home-hero"),
		document.querySelector(".home-aurora__hero-example"),
		document.querySelector(".home-aurora__mvp"),
	].filter((node): node is Element => node != null);
}

/**
 * Static “with” plus a cycling accent name. The name is the only thing that
 * slides; both stay inline so copy is “with ArkType” on one line.
 */
export function HeroNameCycle() {
	const [index, setIndex] = useState(0);
	const [reduceMotion, setReduceMotion] = useState(false);
	const [paused, setPaused] = useState(false);
	const currentRef = useRef(index);
	const prevRef = useRef(index);
	if (currentRef.current !== index) {
		prevRef.current = currentRef.current;
		currentRef.current = index;
	}
	const previous = prevRef.current;

	useEffect(() => {
		if (typeof window.matchMedia !== "function") return;
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		const sync = () => {
			const reduce = mq.matches;
			setReduceMotion(reduce);
			if (reduce) setIndex(0);
		};
		sync();
		mq.addEventListener("change", sync);
		return () => mq.removeEventListener("change", sync);
	}, []);

	useEffect(() => {
		const enter = () => setPaused(true);
		const leave = () => setPaused(false);
		const regions = pauseRegions();
		for (const el of regions) {
			el.addEventListener("pointerenter", enter);
			el.addEventListener("pointerleave", leave);
		}
		return () => {
			for (const el of regions) {
				el.removeEventListener("pointerenter", enter);
				el.removeEventListener("pointerleave", leave);
			}
		};
	}, []);

	useEffect(() => {
		if (reduceMotion || paused) return;

		const tick = () => {
			if (document.hidden || prefersReducedMotion()) return;
			setIndex(nextIndex);
		};

		const intervalId = window.setInterval(tick, HERO_DWELL_MS);
		return () => window.clearInterval(intervalId);
	}, [reduceMotion, paused]);

	return (
		<span className="home-aurora__cycle">
			<span className="home-aurora__cycle-with">with{"\u00a0"}</span>
			<span className="home-aurora__cycle-viewport">
				{HERO_HEADLINE_NAMES.map((name, nameIndex) => {
					if (nameIndex !== index && nameIndex !== previous) return null;
					const pos = nameIndex === index ? "current" : "prev";
					return (
						<span
							key={name}
							className="home-aurora__cycle-item"
							data-pos={pos}
							aria-hidden={pos === "current" ? undefined : true}
						>
							{name}
						</span>
					);
				})}
			</span>
		</span>
	);
}
