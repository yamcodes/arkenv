import type { ComponentProps } from "react";

export function Heading({
	id,
	children,
	as: Component = "h1",
	...props
}: ComponentProps<"h1"> & {
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}) {
	if (!id) return <Component {...props}>{children}</Component>;

	return (
		<Component id={id} className="group relative" {...props}>
			<a
				href={`#${id}`}
				className="select-none text-primary opacity-50 sm:opacity-0 hover:opacity-100 group-hover:opacity-100 no-underline absolute -left-5 transition-opacity duration-200"
				aria-label="Link to section"
			>
				#
			</a>
			{children}
		</Component>
	);
}
