import type { ComponentProps } from "react";
import { useEffect, useState } from "react";

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
		const handleClickOutside = (event: MouseEvent) => {
			// Check if the click is outside any heading
			const target = event.target as Element;
			if (!target.closest("h1, h2, h3, h4, h5, h6")) {
				setIsActive(false);
			}
		};

		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	const handleAnchorClick = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsActive(true);
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
