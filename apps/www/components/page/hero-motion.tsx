"use client";

import { useEffect } from "react";

/**
 * Longest rise (1s blur) + max `animationDelay` (400ms) + small buffer.
 */
const HERO_MOTION_DONE_MS = 1500;

/**
 * Survives React Strict Mode remounts and late HomeLayout child replacements
 * so the load-time rise only plays once per page load.
 */
let heroMotionCompleted = false;

/**
 * One-shot hero entrance. CSS `.rise` / `.rise-blur` only animate while
 * `.home-aurora[data-hero-motion=play]`.
 *
 * Why this is careful:
 * - `HomeLayout` is a client boundary; its children can remount after hydrate.
 *   Leaving `play` on forever restarts CSS animations on the new nodes.
 * - React Strict Mode runs effects twice; we must not flip to `done` before
 *   `play` has actually started, or the entrance is skipped.
 */
export function HeroMotion() {
	useEffect(() => {
		const root = document.querySelector(".home-aurora");
		if (!root) return;

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			heroMotionCompleted = true;
			root.setAttribute("data-hero-motion", "done");
			return;
		}

		const state = root.getAttribute("data-hero-motion");
		if (heroMotionCompleted || state === "done") {
			root.setAttribute("data-hero-motion", "done");
			return;
		}
		// Mid-flight from a prior mount — do not restart or snap to done.
		if (state === "play") return;

		let cancelled = false;
		let doneTimer = 0;
		let observer: MutationObserver | undefined;

		const finish = () => {
			heroMotionCompleted = true;
			observer?.disconnect();
			root.setAttribute("data-hero-motion", "done");
		};

		// Macrotask so Strict Mode's sync remount finishes before we arm motion.
		const startTimer = window.setTimeout(() => {
			if (cancelled || heroMotionCompleted) return;

			root.setAttribute("data-hero-motion", "prep");

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					if (cancelled || heroMotionCompleted) return;

					root.setAttribute("data-hero-motion", "play");

					// If HomeLayout replaces `.rise` nodes while `play` is set,
					// flip to `done` before the next paint so the new nodes do not
					// restart the CSS animation (double fade).
					observer = new MutationObserver((mutations) => {
						if (root.getAttribute("data-hero-motion") !== "play") return;
						for (const mutation of mutations) {
							for (const node of mutation.addedNodes) {
								if (!(node instanceof HTMLElement)) continue;
								if (
									node.matches(".rise, .rise-blur") ||
									node.querySelector(".rise, .rise-blur")
								) {
									finish();
									return;
								}
							}
						}
					});
					observer.observe(root, { childList: true, subtree: true });

					doneTimer = window.setTimeout(finish, HERO_MOTION_DONE_MS);
				});
			});
		}, 0);

		return () => {
			cancelled = true;
			window.clearTimeout(startTimer);
			// If `play` already started, leave the done timer + observer alone so a
			// remount cannot re-arm the entrance. Otherwise reset prep so the
			// Strict Mode remount can start cleanly.
			if (root.getAttribute("data-hero-motion") === "play") return;
			window.clearTimeout(doneTimer);
			observer?.disconnect();
			if (root.getAttribute("data-hero-motion") === "prep") {
				root.removeAttribute("data-hero-motion");
			}
		};
	}, []);

	return null;
}
