"use client";

import { HeaderGithubLink } from "~/components/page/header-github-link";
import { Logo } from "~/components/page/logo";
import { SearchToggle } from "~/components/ui/search-toggle";
import { ThemeToggle } from "~/components/ui/theme-toggle";

export function HomeNav() {
	return (
		<nav className="home-aurora__nav" aria-label="Primary">
			<a href="/" className="home-aurora__wordmark" aria-label="ArkEnv home">
				<Logo />
			</a>
			<ul className="home-aurora__nav-links">
				<li>
					<a href="/docs/arkenv">Documentation</a>
				</li>
				<li>
					<a
						href="https://github.com/yamcodes/arkenv/issues/683"
						target="_blank"
						rel="noopener noreferrer"
					>
						Roadmap
					</a>
				</li>
			</ul>
			<div className="home-aurora__nav-actions">
				<SearchToggle />
				<ThemeToggle />
				<HeaderGithubLink className="hidden md:inline-flex items-center gap-1.5 h-8 px-2 text-[var(--color-ink-2)] hover:text-[var(--color-ink)]" />
				<a className="home-aurora__nav-cta" href="/docs/arkenv/quickstart">
					Get Started
				</a>
			</div>
		</nav>
	);
}
