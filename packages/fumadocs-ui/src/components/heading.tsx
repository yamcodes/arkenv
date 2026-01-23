"use client";

import { LinkIcon } from "lucide-react";
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/utils/cn";

type Types = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type HeadingProps<T extends Types> = Omit<ComponentPropsWithoutRef<T>, "as"> & {
	as?: T;
};

export function Heading<T extends Types = "h1">({
	as,
	className,
	children,
	...props
}: HeadingProps<T>) {
	const As = (as || "h1") as ElementType;

	if (!props.id) {
		return (
			<As className={cn("font-bold tracking-tight", className)} {...props}>
				{children}
			</As>
		);
	}

	return (
		<As
			className={cn(
				"group relative scroll-m-32 font-bold tracking-tight", // increased scroll-m to account for taller header
				className,
			)}
			data-arkenv-heading
			{...props}
		>
			<div
				className="absolute -left-7 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 w-8"
				data-arkenv-heading-icon
			>
				<a
					href={`#${props.id}`}
					className="p-1 rounded-md text-fd-primary focus:outline-none opacity-100 hover:opacity-100 hover:text-fd-primary active:ring-2 active:ring-fd-primary"
					aria-label="Link to section"
					data-no-underline
					data-arkenv-heading-link
				>
					<LinkIcon className="size-4" />
				</a>
			</div>
			<a
				href={`#${props.id}`}
				className="inline font-inherit text-inherit no-underline opacity-100 hover:opacity-100 hover:text-inherit"
				data-no-underline
				data-arkenv-heading-link
			>
				{children}
			</a>
		</As>
	);
}
