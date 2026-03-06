"use client";

import FumadocsLink from "fumadocs-core/link";
import { type ReactNode, useEffect, useState } from "react";
import { ExternalLink } from "@/components/external-link";
import { cn } from "@/utils/cn";

export type HeaderLink = {
	text: string;
	url: string;
};

export type HeaderProps = {
	logo?: ReactNode;
	logoHref?: string;
	links?: HeaderLink[];
	actions?: ReactNode[];
};

export function Header({ logo, logoHref = "/", links, actions }: HeaderProps) {
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
			<div className="flex items-center h-full px-4 sm:px-6 lg:px-12 max-w-(--fd-layout-width) mx-auto w-full">
				{/* Left: logo */}
				<div className="flex-1 flex items-center">
					<FumadocsLink href={logoHref} className="flex items-center">
						{logo}
					</FumadocsLink>
				</div>

				{/* Center: nav links (hidden on mobile) */}
				{links && links.length > 0 && (
					<nav className="hidden md:flex items-center">
						{links.map((link) => (
							<ExternalLink
								key={link.url}
								href={link.url}
								className="px-3 py-1.5 text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors"
							>
								{link.text}
							</ExternalLink>
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
