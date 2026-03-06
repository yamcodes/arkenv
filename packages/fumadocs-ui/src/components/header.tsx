"use client";

import FumadocsLink from "fumadocs-core/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Fragment, type ReactNode, useEffect, useState } from "react";
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
	/** Rendered in the mobile menu "Appearance" row (label left, content right). */
	menuActions?: ReactNode[];
	/** Rendered centered at the very bottom of the mobile menu (e.g. social icons). */
	menuSocialActions?: ReactNode[];
	/** Optional trigger rendered left of the logo on mobile (e.g. sidebar toggle). */
	sidebarTrigger?: ReactNode;
};

export function Header({
	logo,
	logoHref = "/",
	links,
	actions,
	menuActions,
	menuSocialActions,
	sidebarTrigger,
}: HeaderProps) {
	const [scrolled, setScrolled] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 0);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname triggers close but is not referenced in the effect body
	useEffect(() => {
		setMobileOpen(false);
	}, [pathname]);

	useEffect(() => {
		document.body.style.overflow = mobileOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileOpen]);

	const hasLinks = links && links.length > 0;
	const hasMenuActions = menuActions && menuActions.length > 0;
	const hasSocialActions = menuSocialActions && menuSocialActions.length > 0;
	const hasMobileMenu = hasLinks || hasMenuActions || hasSocialActions;
	const hasRightContent = (actions && actions.length > 0) || hasMobileMenu;

	return (
		<header
			className={cn(
				"fixed top-0 left-0 right-0 z-50",
				"h-(--fd-nav-height,80px)",
				"border-b transition-[background-color,border-color,backdrop-filter] duration-300",
				mobileOpen && "max-md:border-b-transparent",
				scrolled && !mobileOpen
					? "border-fd-border/60 bg-(--background)/85 backdrop-blur-xl"
					: "border-fd-border/60 bg-background",
			)}
		>
			<div className="flex items-center h-full px-4 max-w-(--fd-layout-width) mx-auto w-full">
				{/* Left: sidebar trigger (mobile) + logo + nav links */}
				<div className="flex items-center gap-2 md:gap-6">
					{sidebarTrigger && <div className="md:hidden">{sidebarTrigger}</div>}
					{logo && (
						<FumadocsLink
							href={logoHref}
							className="flex items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
						>
							{logo}
						</FumadocsLink>
					)}

					{hasLinks && (
						<nav className="hidden md:flex items-center gap-0.5">
							{links.map((link) => {
								const isInternal = link.url.startsWith("/");
								const canonicalMatch = link.activeMatch ?? link.url;
								const isActive = isInternal
									? pathname === canonicalMatch ||
										pathname.startsWith(`${canonicalMatch}/`)
									: false;
								return (
									<ExternalLink
										key={link.url}
										href={link.url}
										className={cn(
											"px-3 py-1.5 text-[1rem] font-normal rounded-md transition-colors duration-150",
											"outline-none focus-visible:ring-2 focus-visible:ring-fd-ring",
											isActive
												? "text-fd-primary"
												: "text-fd-foreground hover:text-fd-primary",
										)}
									>
										{link.text}
									</ExternalLink>
								);
							})}
						</nav>
					)}
				</div>

				{/* Right: actions + hamburger */}
				{hasRightContent && (
					<div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
						{actions?.map((action, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static action list
							<Fragment key={i}>{action}</Fragment>
						))}
						{hasMobileMenu && (
							<button
								type="button"
								className="md:hidden flex items-center justify-center h-8 w-8 rounded-md text-fd-foreground hover:text-fd-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
								onClick={() => setMobileOpen((open) => !open)}
								aria-label="Toggle menu"
								aria-expanded={mobileOpen}
							>
								{mobileOpen ? (
									<X className="h-5 w-5" />
								) : (
									<Menu className="h-5 w-5" />
								)}
							</button>
						)}
					</div>
				)}
			</div>

			{/* Mobile dropdown menu */}
			{mobileOpen && (
				<div
					className="md:hidden fixed inset-0 z-40 bg-fd-background flex flex-col px-4 py-6"
					style={{ top: "var(--fd-nav-height, 80px)" }}
				>
					<div className="flex-1 flex flex-col">
						{hasLinks &&
							links.map((link) => {
								const isInternal = link.url.startsWith("/");
								const canonicalMatch = link.activeMatch ?? link.url;
								const isActive = isInternal
									? pathname === canonicalMatch ||
										pathname.startsWith(canonicalMatch + "/")
									: false;
								return (
									<ExternalLink
										key={link.url}
										href={link.url}
										className={cn(
											"px-3 py-3 text-[1.125rem] font-normal rounded-md transition-colors duration-150 w-full",
											"outline-none focus-visible:ring-2 focus-visible:ring-fd-ring",
											isActive
												? "text-fd-primary"
												: "text-fd-foreground hover:text-fd-primary",
										)}
									>
										{link.text}
									</ExternalLink>
								);
							})}
					</div>
					{hasMenuActions && (
						<div className="flex items-center justify-between py-4 border-t border-fd-border">
							<span className="text-sm font-medium text-fd-foreground">
								Appearance
							</span>
							<div className="flex items-center gap-2">
								{menuActions.map((action, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: static action list
									<div key={i}>{action}</div>
								))}
							</div>
						</div>
					)}
					{hasSocialActions && (
						<div className="py-4 flex items-center justify-center gap-4">
							{menuSocialActions.map((action, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static action list
								<div key={i}>{action}</div>
							))}
						</div>
					)}
				</div>
			)}
		</header>
	);
}
