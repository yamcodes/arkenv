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
					<a href="/#why">Why ArkEnv?</a>
				</li>
				<li>
					<a href="/docs/cli/hosting-presets">Presets</a>
				</li>
				<li>
					<a href="/docs">Docs</a>
				</li>
			</ul>
			<div className="home-aurora__nav-actions">
				<div className="home-aurora__nav-utils">
					<SearchToggle />
					<ThemeToggle />
					<HeaderGithubLink className="home-aurora__nav-github" />
				</div>
				<a className="home-aurora__nav-cta" href="/docs/getting-started">
					Get started <span aria-hidden="true">→</span>
				</a>
			</div>
		</nav>
	);
}
