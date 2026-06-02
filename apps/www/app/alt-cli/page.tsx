import { ExternalLink } from "@arkenv/fumadocs-ui/components";
import type { Metadata } from "next";
import { CLICommand } from "~/components/page";
import { InstallTabs } from "~/components/page/install-tabs";
import { TerminalTabs } from "~/components/page/terminal-tabs";

export const metadata: Metadata = {
	title: "ArkEnv — typesafe env vars",
	description: "Environment variable validation from editor to runtime",
};

export default function AltCliPage() {
	return (
		<div id="alt-cli">
			{/* N9 · Edge-aligned minimal nav */}
			<nav className="cli-nav" role="navigation" aria-label="Main">
				<a href="/" className="cli-nav__wordmark">
					<svg width="16" height="16" viewBox="0 0 12 12" aria-hidden="true">
						<path fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" d="M8.5 6c0-1.379-1.121-2.5-2.5-2.5A2.502 2.502 0 0 0 3.5 6c0 1.379 1.121 2.5 2.5 2.5S8.5 7.379 8.5 6ZM6 11V8.5M1 6h2.5m5 0H11M6 3.5V1M2.464 2.464l1.768 1.768m3.536 3.536 1.768 1.768m-7.072 0 1.768-1.768m3.536-3.536 1.768-1.768" />
						<circle cx="6" cy="6" r="0.9" fill="currentColor" />
					</svg>
					ArkEnv
				</a>
				<a href="/docs/arkenv" className="cli-nav__cta">
					--docs
				</a>
			</nav>

			{/* Hero */}
			<section className="cli-hero">
				<div className="cli-hero__label">env.ts</div>
				<h1 className="cli-hero__headline">
					Typesafe env vars.<br />No surprises.
				</h1>
				<p className="cli-hero__sub">
					Environment variable validation from editor to runtime. One schema.
					Full autocomplete. Zero runtime overhead.
				</p>
				<div className="cli-hero__actions">
					<a href="/docs/arkenv/quickstart" className="cli-btn cli-btn--primary">
						$ npx arkenv init
					</a>
					<a href="/docs/arkenv" className="cli-btn cli-btn--ghost">
						Read the docs &rarr;
					</a>
				</div>

				{/* Stats row (opencode.ai inspired) */}
				<div className="cli-stats">
					<div className="cli-stat">
						<div className="cli-stat__value">1</div>
						<div className="cli-stat__label">schema file</div>
					</div>
					<div className="cli-stat">
						<div className="cli-stat__value">6</div>
						<div className="cli-stat__label">framework plugins</div>
					</div>
					<div className="cli-stat">
						<div className="cli-stat__value">0</div>
						<div className="cli-stat__label">runtime deps</div>
					</div>
				</div>
			</section>

			{/* Feature grid (openspec.dev border-separated) */}
			<section className="cli-grid">
				<div className="cli-grid__wrap">
					<div className="cli-grid__item">
						<span className="cli-grid__kicker">$ declare</span>
						<h3 className="cli-grid__title">One schema.</h3>
						<p className="cli-grid__desc">
							Define your env vars once in a single <code>env.ts</code>.
							TypeScript infers every type automatically.
						</p>
					</div>
					<div className="cli-grid__item">
						<span className="cli-grid__kicker">$ infer</span>
						<h3 className="cli-grid__title">Full types.</h3>
						<p className="cli-grid__desc">
							Autocomplete for every variable. No codegen, no build
							step, no runtime dependencies.
						</p>
					</div>
					<div className="cli-grid__item">
						<span className="cli-grid__kicker">$ validate</span>
						<h3 className="cli-grid__title">Every boundary.</h3>
						<p className="cli-grid__desc">
							Build-time checks catch missing vars before deploy.
							Runtime guards against config drift in production.
						</p>
					</div>
					<div className="cli-grid__item">
						<span className="cli-grid__kicker">$ integrate</span>
						<h3 className="cli-grid__title">Your stack.</h3>
						<p className="cli-grid__desc">
							One plugin per framework. Next.js, Vite, Bun &mdash;
							one line of config, zero runtime overhead.
						</p>
					</div>
				</div>
			</section>

			{/* Terminal showcase (openspec.dev inspired) */}
			<section className="cli-term">
				<TerminalTabs />
			</section>

			{/* CTA */}
			<section className="cli-cta">
				<h2 className="cli-cta__title">
					Ship typesafe env vars &mdash; from editor to runtime.
				</h2>
				<p className="cli-cta__sub">
					Zero setup. Full autocomplete. One schema everywhere.
				</p>

				{/* Tabbed install command (opencode.ai inspired) */}
				<InstallTabs />

				<div className="cli-cta__actions">
					<a href="/docs/arkenv/quickstart" className="cli-btn cli-btn--primary">
						$ npx arkenv init
					</a>
					<CLICommand />
				</div>
			</section>

			{/* Footer — Ft2 Inline single line */}
			<footer className="cli-footer">
				<div className="cli-footer__inner">
					<span>ArkEnv &middot; MIT License &middot; &copy; 2025&ndash;present Yam Borodetsky</span>
					<div className="cli-footer__links">
						<ExternalLink href="https://arktype.io/docs/ecosystem#arkenv" className="cli-footer__link">
							Ecosystem
						</ExternalLink>
						<span className="cli-footer__sep" aria-hidden="true">/</span>
						<ExternalLink href="https://github.com/yamcodes/arkenv" className="cli-footer__link">
							GitHub
						</ExternalLink>
						<span className="cli-footer__sep" aria-hidden="true">/</span>
						<a href="/docs/arkenv" className="cli-footer__link">
							Documentation
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
