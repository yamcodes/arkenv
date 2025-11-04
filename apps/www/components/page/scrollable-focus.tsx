"use client";

import { useEffect } from "react";

/**
 * Adds keyboard focus support to fumadocs scrollable code block containers.
 *
 * This component makes scrollable regions (`.fd-scroll-container`) keyboard accessible
 * by adding `tabindex="0"` to containers that are scrollable (have overflow content).
 *
 * Without this, keyboard users cannot scroll through long code blocks, which is a
 * serious accessibility violation (WCAG 2.1.1 - Keyboard).
 *
 * @see https://github.com/fuma-nama/fumadocs
 */
export function ScrollableFocus() {
	useEffect(() => {
		// Find all fumadocs scroll containers
		const containers = document.querySelectorAll(".fd-scroll-container");

		for (const container of containers) {
			const element = container as HTMLElement;

			// Only add tabindex if the element is actually scrollable
			// Check both horizontal and vertical overflow
			const isScrollable =
				element.scrollWidth > element.clientWidth ||
				element.scrollHeight > element.clientHeight;

			if (isScrollable) {
				// Make keyboard focusable
				element.setAttribute("tabindex", "0");

				// Add ARIA label for screen readers
				const existingLabel = element.getAttribute("aria-label");
				if (!existingLabel) {
					element.setAttribute(
						"aria-label",
						"Scrollable code block. Use arrow keys to scroll.",
					);
				}

				// Add role if not already present
				const existingRole = element.getAttribute("role");
				if (!existingRole) {
					element.setAttribute("role", "region");
				}
			}
		}
	}, []); // Run once on mount

	return null; // This component renders nothing
}
