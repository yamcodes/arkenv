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

	if (!id)
		return (
			<Component className={className} {...props}>
				{children}
			</Component>
		);

	return (
		<Component
			id={id}
			className={`group relative scroll-mt-40 ${className || ""}`}
			{...props}
		>
			<a
				href={`#${id}`}
				className={`select-none text-primary no-underline absolute -left-5 transition-opacity duration-200 ${
					isActive
						? "opacity-100"
						: "opacity-0 hover:opacity-100 group-hover:opacity-100 focus:opacity-100"
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
