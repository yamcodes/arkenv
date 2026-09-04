"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { HeaderGithubLink } from "~/components/page/header-github-link";
import { Logo } from "~/components/page/logo";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { useFeatureFlag } from "~/hooks/use-feature-flag";
import { FeatureFlag } from "~/lib/posthog/feature-flags";
import { STACKBLITZ_PLAYGROUND_URL } from "~/lib/stackblitz";
import { cn } from "~/lib/utils";
import "./site-nav.css";

type NavLink = {
	text: string;
	url: string;
	activeMatch?: string;
	external?: boolean;
};

const NAV_CORE_LINKS: NavLink[] = [
	{ text: "Docs", url: "/docs", activeMatch: "/docs" },
	{ text: "Blog", url: "/blog", activeMatch: "/blog" },
	{
		text: "Roadmap",
		url: "/roadmap",
		activeMatch: "/roadmap",
	},
	{
		text: "Playground",
		url: STACKBLITZ_PLAYGROUND_URL,
		external: true,
	},
];

function isLinkActive(pathname: string, link: NavLink): boolean {
	if (link.external || !link.activeMatch) return false;
	return (
		pathname === link.activeMatch || pathname.startsWith(`${link.activeMatch}/`)
	);
}

function SiteNavLink({
	link,
	pathname,
	variant,
	tabIndex,
	onNavigate,
}: {
	link: NavLink;
	pathname: string;
	variant: "desktop" | "menu";
	tabIndex?: number;
	/**
	 * Close mobile menu (same-page hashes don't change pathname).
	 */
	onNavigate?: () => void;
}) {
	const active = isLinkActive(pathname, link);
	const base = variant === "desktop" ? "site-nav__link" : "site-nav__menu-link";
	const className = cn(
		base,
		active && `${base}--active`,
		link.external && "site-nav__link--external",
	);

	if (link.external) {
		return (
			<a
				href={link.url}
				className={className}
				target="_blank"
				rel="noopener noreferrer"
				tabIndex={tabIndex}
				onClick={onNavigate}
			>
				{link.text}
				<ArrowUpRight className="site-nav__external-icon" aria-hidden="true" />
			</a>
		);
	}

	return (
		<a
			href={link.url}
			className={className}
			tabIndex={tabIndex}
			onClick={onNavigate}
		>
			{link.text}
		</a>
	);
}

/**
 * Docs-only — same footprint as Get started (`.site-nav__action`).
 */
function SiteNavSearchAction() {
	const { setOpenSearch } = useSearchContext();
	const [modifier, setModifier] = useState("Ctrl");

	useEffect(() => {
		const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
		setModifier(isMac ? "⌘" : "Ctrl");
	}, []);

	return (
		<button
			type="button"
			aria-label="Open Search"
			className="site-nav__action site-nav__action--search"
			onClick={() => setOpenSearch(true)}
		>
			<Search className="site-nav__action-icon" aria-hidden="true" />
			<span className="site-nav__action-label">Search</span>
			<span className="site-nav__action-keys" aria-hidden="true">
				<kbd>{modifier}</kbd>
				<kbd>K</kbd>
			</span>
		</button>
	);
}

export type SiteNavProps = {
	/**
	 * Home / 404 — Get started in the shared right action slot.
	 */
	showGetStarted?: boolean;
	/**
	 * Docs — Search in the shared right action slot (same footprint as Get started).
	 */
	showSearch?: boolean;
	/**
	 * Docs mobile only — sidebar tree toggle.
	 */
	sidebarTrigger?: ReactNode;
};

export function SiteNav({
	showGetStarted = false,
	showSearch = false,
	sidebarTrigger,
}: SiteNavProps) {
	const pathname = usePathname();
	const themeToggleEnabled = useFeatureFlag(FeatureFlag.THEME_TOGGLE);
	const [dense, setDense] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		const onScroll = () => setDense(window.scrollY > 0);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

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
			<header className={cn("site-nav", dense && "site-nav--dense")}>
				<div className="site-nav__surface">
					<div className="site-nav__inner">
						<div className="site-nav__start">
							{sidebarTrigger ? (
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
						</div>

						<nav className="site-nav__links" aria-label="Primary">
							{NAV_CORE_LINKS.map((link) => (
								<SiteNavLink
									key={link.url}
									link={link}
									pathname={pathname}
									variant="desktop"
								/>
							))}
						</nav>

						<div className="site-nav__end">
							<div className="site-nav__utils">
								{themeToggleEnabled ? (
									<div className="site-nav__theme">
										<ThemeToggle />
									</div>
								) : null}
								<HeaderGithubLink className="site-nav__github" />
							</div>
							{showGetStarted ? (
								<a
									className="site-nav__action site-nav__action--cta"
									href="/docs/getting-started"
								>
									<span className="site-nav__action-label">
										Get started <span aria-hidden="true">→</span>
									</span>
								</a>
							) : null}
							{showSearch ? <SiteNavSearchAction /> : null}
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
					{NAV_CORE_LINKS.map((link) => (
						<SiteNavLink
							key={link.url}
							link={link}
							pathname={pathname}
							variant="menu"
							tabIndex={mobileOpen ? undefined : -1}
							onNavigate={() => setMobileOpen(false)}
						/>
					))}
					{showGetStarted ? (
						<a
							className="site-nav__menu-cta"
							href="/docs/getting-started"
							tabIndex={mobileOpen ? undefined : -1}
							onClick={() => setMobileOpen(false)}
						>
							Get started <span aria-hidden="true">→</span>
						</a>
					) : null}
				</nav>
				{themeToggleEnabled ? (
					<div className="site-nav__menu-appearance">
						<span>Appearance</span>
						<ThemeToggle />
					</div>
				) : null}
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

export function SiteNavHome() {
	return <SiteNav showGetStarted />;
}

/**
 * Docs chrome — a direct child of `#docs-chrome-shell` so sticky header is not
 * a fumadocs grid item. Pass the sidebar trigger so it SSRs with the bar.
 */
export function SiteNavDocs({
	sidebarTrigger,
}: {
	sidebarTrigger?: ReactNode;
}) {
	return <SiteNav showSearch sidebarTrigger={sidebarTrigger} />;
}
