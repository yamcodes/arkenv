"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { HeaderGithubLink } from "~/components/page/header-github-link";
import { Logo } from "~/components/page/logo";
import { SearchToggle } from "~/components/ui/search-toggle";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { cn } from "~/lib/utils";
import "./site-nav.css";

export type SiteNavForm = "pill" | "bar";

type NavLink = {
	text: string;
	url: string;
	activeMatch?: string;
	external?: boolean;
};

const NAV_CORE_LINKS: NavLink[] = [
	{ text: "Why ArkEnv?", url: "/#why" },
	{
		text: "Presets",
		url: "/docs/validating-environment-variables",
		activeMatch: "/docs/validating-environment-variables",
	},
	{ text: "Docs", url: "/docs", activeMatch: "/docs" },
];

const ROADMAP_LINK: NavLink = {
	text: "Roadmap",
	url: "https://github.com/yamcodes/arkenv/issues/683",
	external: true,
};

function isLinkActive(pathname: string, link: NavLink): boolean {
	if (link.external || !link.activeMatch) return false;
	return (
		pathname === link.activeMatch || pathname.startsWith(`${link.activeMatch}/`)
	);
}

export type SiteNavProps = {
	form: SiteNavForm;
	/** Docs bar only — mobile sidebar toggle. */
	sidebarTrigger?: ReactNode;
};

export function SiteNav({ form, sidebarTrigger }: SiteNavProps) {
	const pathname = usePathname();
	const [dense, setDense] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	const isBar = form === "bar";
	const desktopLinks = isBar
		? [...NAV_CORE_LINKS, ROADMAP_LINK]
		: NAV_CORE_LINKS;
	const menuLinks = isBar ? [...NAV_CORE_LINKS, ROADMAP_LINK] : NAV_CORE_LINKS;

	useEffect(() => {
		if (!isBar) {
			setDense(false);
			return;
		}
		const onScroll = () => setDense(window.scrollY > 0);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, [isBar]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: close menu on route change
	useEffect(() => {
		setMobileOpen(false);
	}, [pathname]);

	useEffect(() => {
		document.body.style.overflow = mobileOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileOpen]);

	return (
		<div className="site-nav-root">
			<header
				className={cn(
					"site-nav",
					isBar ? "site-nav--bar" : "site-nav--pill",
					isBar && dense && "site-nav--dense",
				)}
			>
				<div className="site-nav__surface">
					<div className="site-nav__inner">
						<div className="site-nav__start">
							{isBar && sidebarTrigger ? (
								<div className="site-nav__sidebar-trigger">
									{sidebarTrigger}
								</div>
							) : null}
							<Link
								href="/"
								className="site-nav__wordmark"
								aria-label="ArkEnv home"
							>
								<Logo />
							</Link>
							<nav className="site-nav__links" aria-label="Primary">
								{desktopLinks.map((link) => {
									const active = isLinkActive(pathname, link);
									const className = cn(
										"site-nav__link",
										active && "site-nav__link--active",
									);
									if (link.external) {
										return (
											<a
												key={link.url}
												href={link.url}
												className={className}
												target="_blank"
												rel="noopener noreferrer"
											>
												{link.text}
											</a>
										);
									}
									return (
										<a key={link.url} href={link.url} className={className}>
											{link.text}
										</a>
									);
								})}
							</nav>
						</div>

						<div className="site-nav__end">
							<div className="site-nav__utils">
								<SearchToggle />
								<div className="site-nav__theme">
									<ThemeToggle />
								</div>
								<HeaderGithubLink className="site-nav__github" />
							</div>
							{!isBar ? (
								<a className="site-nav__cta" href="/docs/getting-started">
									Get started <span aria-hidden="true">→</span>
								</a>
							) : null}
							<button
								type="button"
								className="site-nav__menu-toggle"
								onClick={() => setMobileOpen((open) => !open)}
								aria-label="Toggle menu"
								aria-expanded={mobileOpen}
							>
								{mobileOpen ? (
									<X className="size-5" aria-hidden="true" />
								) : (
									<Menu className="size-5" aria-hidden="true" />
								)}
							</button>
						</div>
					</div>
				</div>
			</header>

			<div
				className={cn(
					"site-nav__menu-panel",
					mobileOpen && "site-nav__menu-panel--open",
				)}
				aria-hidden={!mobileOpen}
			>
				<nav className="site-nav__menu-links" aria-label="Primary">
					{menuLinks.map((link) => {
						const active = isLinkActive(pathname, link);
						const className = cn(
							"site-nav__menu-link",
							active && "site-nav__menu-link--active",
						);
						if (link.external) {
							return (
								<a
									key={link.url}
									href={link.url}
									className={className}
									target="_blank"
									rel="noopener noreferrer"
									tabIndex={mobileOpen ? undefined : -1}
								>
									{link.text}
								</a>
							);
						}
						return (
							<a
								key={link.url}
								href={link.url}
								className={className}
								tabIndex={mobileOpen ? undefined : -1}
							>
								{link.text}
							</a>
						);
					})}
					{!isBar ? (
						<a
							className="site-nav__menu-cta"
							href="/docs/getting-started"
							tabIndex={mobileOpen ? undefined : -1}
						>
							Get started <span aria-hidden="true">→</span>
						</a>
					) : null}
				</nav>
				<div className="site-nav__menu-appearance">
					<span>Appearance</span>
					<ThemeToggle />
				</div>
				<div className="site-nav__menu-social">
					<HeaderGithubLink
						className="site-nav__menu-github"
						iconClassName="size-6"
					/>
				</div>
			</div>
		</div>
	);
}

export function SiteNavPill() {
	return <SiteNav form="pill" />;
}

export function SiteNavBar({ sidebarTrigger }: { sidebarTrigger?: ReactNode }) {
	return <SiteNav form="bar" sidebarTrigger={sidebarTrigger} />;
}
