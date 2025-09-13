import type { ComponentProps } from "react";

export function Heading({
	id,
	children,
	as: Component = "h1",
	className,
	...props
}: ComponentProps<"h1"> & {
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}) {
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
				className="select-none text-primary opacity-0 hover:opacity-100 group-hover:opacity-100 focus:opacity-100 group-active:opacity-100 no-underline absolute -left-5 transition-opacity duration-200"
				aria-label="Link to section"
				tabIndex={0}
			>
				#
			</a>
			{children}
		</Component>
	);
}
