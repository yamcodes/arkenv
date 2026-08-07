"use client";

import { useEffect } from "react";

/** Survives React Strict Mode remounts so load-time rise only plays once. */
let heroMotionPlayed = false;

/**
 * One-shot hero entrance. CSS `.rise` / `.rise-blur` only animate while
 * `.home-aurora[data-hero-motion=play]` — avoids the double fade when the
 * client `HomeLayout` remounts and restarts CSS animations mid-flight.
 */
export function HeroMotion() {
	useEffect(() => {
		const root = document.querySelector(".home-aurora");
		if (!root) return;

		if (
			heroMotionPlayed ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		) {
			root.setAttribute("data-hero-motion", "done");
			return;
		}

		heroMotionPlayed = true;
		root.setAttribute("data-hero-motion", "prep");

		const id = requestAnimationFrame(() => {
			root.setAttribute("data-hero-motion", "play");
		});

		return () => cancelAnimationFrame(id);
	}, []);

	return null;
}
