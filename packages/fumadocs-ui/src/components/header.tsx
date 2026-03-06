"use client";

import FumadocsLink from "fumadocs-core/link";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/utils/cn";

export type HeaderLink = {
	text: string;
	url: string;
};

export type HeaderProps = {
	logo?: ReactNode;
	links?: HeaderLink[];
	actions?: ReactNode[];
};

export function Header({ logo, links, actions }: HeaderProps) {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 0);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<header
			className={cn(
				"fixed top-0 left-0 right-0 z-50",
				"h-[var(--fd-nav-height,80px)]",
				"transition-colors duration-200",
				scrolled
					? "border-b border-fd-border/50 bg-fd-background/80 backdrop-blur-md"
					: "bg-transparent",
			)}
		>
			<div className="flex items-center h-full px-6 max-w-screen-xl mx-auto w-full">
				{/* Left: logo */}
				<div className="flex-1 flex items-center">{logo}</div>

				{/* Center: nav links (hidden on mobile) */}
				{links && links.length > 0 && (
					<nav className="hidden md:flex items-center">
						{links.map((link) => (
							<FumadocsLink
								key={link.url}
								href={link.url}
								className="px-3 py-1.5 text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors"
							>
								{link.text}
							</FumadocsLink>
						))}
					</nav>
				)}

				{/* Right: actions */}
				{actions && actions.length > 0 && (
					<div className="flex-1 flex items-center justify-end gap-2">
						{actions.map((action, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static action list
							<div key={i}>{action}</div>
						))}
					</div>
				)}
			</div>
		</header>
	);
}
