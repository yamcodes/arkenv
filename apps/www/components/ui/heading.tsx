"use client";

import type { ComponentProps } from "react";
import { useEffect, useState } from "react";

// Global state to track the active heading ID
let activeHeadingId: string | null = null;
const headingListeners = new Set<(activeId: string | null) => void>();

const setActiveHeading = (id: string | null) => {
	activeHeadingId = id;
	headingListeners.forEach((listener) => {
		listener(id);
	});
};

export function Heading({
	id,
	children,
	as: Component = "h1",
	className,
	...props
}: ComponentProps<"h1"> & {
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}) {
	const [isActive, setIsActive] = useState(false);

	useEffect(() => {
		const handleActiveChange = (activeId: string | null) => {
			setIsActive(activeId === id);
		};

		headingListeners.add(handleActiveChange);

		// Set initial state
		setIsActive(activeHeadingId === id);

		const handleClickOutside = (event: MouseEvent) => {
			// Check if the click is outside any heading
			const target = event.target as Element;
			if (!target.closest("h1, h2, h3, h4, h5, h6")) {
				setActiveHeading(null);
			}
		};

		document.addEventListener("click", handleClickOutside);

		return () => {
			headingListeners.delete(handleActiveChange);
			document.removeEventListener("click", handleClickOutside);
		};
	}, [id]);

	const handleAnchorClick = (e: React.MouseEvent) => {
		e.preventDefault();
		setActiveHeading(id ?? null);
		// Still navigate to the anchor
		window.location.hash = `#${id}`;
	};

	const handleHeadingClick = (e: React.MouseEvent) => {
		// Don't handle if the click was on the anchor itself
		if ((e.target as Element).closest('a[href^="#"]')) {
			return;
		}

		// Show the anchor and navigate
		setActiveHeading(id ?? null);
		window.location.hash = `#${id}`;
	};

	if (!id)
		return (
			<Component className={className} {...props}>
				{children}
			</Component>
		);

	return (
		<Component
			id={id}
			className={`group relative scroll-mt-20 ${className || ""}`}
			onClick={handleHeadingClick}
			{...props}
		>
			<a
				href={`#${id}`}
				className={`select-none text-primary no-underline absolute -left-5 transition-opacity duration-200 ${
					isActive
						? "opacity-100 pointer-events-auto"
						: "opacity-0 pointer-events-none hover:opacity-100 hover:pointer-events-auto group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto"
				}`}
				aria-label="Link to section"
				tabIndex={0}
				onClick={handleAnchorClick}
			>
				#
			</a>
			{children}
		</Component>
	);
}
