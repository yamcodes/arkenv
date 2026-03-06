"use client";

import FumadocsLink from "fumadocs-core/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { ExternalLink } from "@/components/external-link";
import { cn } from "@/utils/cn";

export type HeaderLink = {
	text: string;
	url: string;
	/**
	 * Pathname prefix to match for the active state.
	 * Defaults to the link's own URL path for internal links.
	 * External links are never marked active.
	 */
	activeMatch?: string;
};

export type HeaderProps = {
	logo?: ReactNode;
	logoHref?: string;
	links?: HeaderLink[];
	actions?: ReactNode[];
};

export function Header({ logo, logoHref = "/", links, actions }: HeaderProps) {
	const [scrolled, setScrolled] = useState(false);
	const pathname = usePathname();

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
				"border-b transition-[background-color,border-color] duration-300",
				scrolled
					? "border-fd-border/60 bg-fd-background/85 backdrop-blur-xl"
					: "border-transparent bg-transparent",
			)}
		>
			<div className="flex items-center h-full px-4 sm:px-6 lg:px-12 max-w-(--fd-layout-width) mx-auto w-full">
				{/* Left: logo */}
				<div className="flex-1 flex items-center">
					<FumadocsLink
						href={logoHref}
						className="flex items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
					>
						{logo}
					</FumadocsLink>
				</div>

				{/* Center: nav links (hidden on mobile) */}
				{links && links.length > 0 && (
					<nav className="hidden md:flex items-center gap-0.5">
						{links.map((link) => {
							const isInternal = link.url.startsWith("/");
							const isActive = isInternal
								? pathname.startsWith(link.activeMatch ?? link.url)
								: false;
							return (
								<ExternalLink
									key={link.url}
									href={link.url}
									className={cn(
										"px-3 py-1.5 text-sm rounded-md transition-colors duration-150",
										"outline-none focus-visible:ring-2 focus-visible:ring-fd-ring",
										isActive
											? "text-fd-foreground font-medium"
											: "text-fd-muted-foreground hover:text-fd-foreground",
									)}
								>
									{link.text}
								</ExternalLink>
							);
						})}
					</nav>
				)}

				{/* Right: actions */}
				{actions && actions.length > 0 && (
					<div className="flex-1 flex items-center justify-end gap-1">
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
