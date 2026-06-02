import { ExternalLink } from "@arkenv/fumadocs-ui/components";
import type { Metadata } from "next";
import {
	CLICommand,
	CodeFrame,
	CompatibilityRails,
} from "~/components/page";

export const metadata: Metadata = {
	title: "ArkEnv — typesafe env vars",
	description: "Environment variable validation from editor to runtime",
};

const envTsCode = `import arkenv from "arkenv";

const env = arkenv({
  PORT:     "number",
  API_KEY:  "string",
  DATABASE_URL: "string",
  NODE_ENV: "'development' | 'production'",
});

// env.PORT is typed as number
// env.NODE_ENV is typed as "development" | "production"`;

const pluginCode = `// next.config.ts
import arkenv from "arkenv";
import withArkEnv from "@arkenv/nextjs";

const env = arkenv({
  API_URL: "string",
  AUTH_SECRET: "string",
});

// @ts-expect-error nextConfig is defined in the actual config
export default withArkEnv(nextConfig, env);`;

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
			</section>

			{/* Bento Grid — Features */}
			<section className="cli-bento">
				<div className="cli-bento__grid">
					{/* Wide: Code block */}
					<div className="cli-bento__block--full">
						<CodeFrame
							label="env.ts"
							code={envTsCode}
							language="ts"
							caption=""
						/>
					</div>

					{/* Declare */}
					<div className="cli-bento__block cli-bento__accent">
						<span className="cli-bento__kicker">$ declare</span>
						<h3 className="cli-bento__title">One schema.</h3>
						<p className="cli-bento__desc">
							Define your env vars once. TypeScript infers every
							type automatically &mdash; no codegen step required.
						</p>
						<div className="cli-bento__meta">
							<code>env.ts</code> &mdash; single source of truth
						</div>
					</div>

					{/* Infer */}
					<div className="cli-bento__block cli-bento__accent">
						<span className="cli-bento__kicker">$ infer</span>
						<h3 className="cli-bento__title">Full types.</h3>
						<p className="cli-bento__desc">
							Autocomplete for every variable across every
							framework. No runtime dependencies, no build step.
						</p>
						<div className="cli-bento__meta">
							Zero-config TypeScript inference
						</div>
					</div>

					{/* Validate */}
					<div className="cli-bento__block cli-bento__accent">
						<span className="cli-bento__kicker">$ validate</span>
						<h3 className="cli-bento__title">Every boundary.</h3>
						<p className="cli-bento__desc">
							Build-time checks catch missing vars before deploy.
							Runtime guards against config drift in production.
						</p>
						<div className="cli-bento__meta">
							CI &middot; CLI &middot; runtime &mdash; same schema
						</div>
					</div>

					{/* Integrate */}
					<div className="cli-bento__block cli-bento__accent">
						<span className="cli-bento__kicker">$ integrate</span>
						<h3 className="cli-bento__title">Your stack.</h3>
						<p className="cli-bento__desc">
							Drop in a single plugin per framework. Next.js, Vite,
							Bun, or any runtime &mdash; one line of config.
						</p>
						<div className="cli-bento__meta">
							<code>@arkenv/nextjs</code> &middot; <code>@arkenv/vite</code> &middot; <code>@arkenv/bun</code>
						</div>
					</div>

					{/* Plugin code */}
					<div className="cli-bento__block--full">
						<CodeFrame
							label="next.config.ts"
							code={pluginCode}
							language="ts"
							caption=""
						/>
					</div>
				</div>
			</section>

			{/* Output display */}
			<section className="cli-output">
				<pre className="cli-output__pre">
<span className="cli-output__prompt">$</span> arkenv check<br />
<span className="cli-output__dim">───────────────────</span><br />
<span className="cli-output__check">✓</span> API_URL is set <span className="cli-output__dim">(production)</span><br />
<span className="cli-output__check">✓</span> AUTH_SECRET is set <span className="cli-output__dim">(production)</span><br />
<span className="cli-output__check">✓</span> DATABASE_URL is set <span className="cli-output__dim">(production)</span><br />
<span className="cli-output__check">✓</span> NODE_ENV is <span className="cli-output__dim">&ldquo;production&rdquo;</span><br />
<span className="cli-output__dim">───────────────────</span><br />
<span className="cli-output__label">All 12 variables resolved.</span>
				</pre>
			</section>

			{/* Compatibility + CTA */}
			<section className="cli-section-head">
				<span className="cli-section-head__kicker">$ plugins</span>
				<h2 className="cli-section-head__title">
					One plugin. Every framework.
				</h2>
				<div style={{ marginTop: "var(--space-lg)" }}>
					<CompatibilityRails className="max-w-full mx-0" />
				</div>
			</section>

			{/* Final CTA */}
			<section className="cli-cta">
				<h2 className="cli-cta__title">
					Ship typesafe env vars &mdash; from editor to runtime.
				</h2>
				<p className="cli-cta__sub">
					Zero setup. Full autocomplete. One schema everywhere.
				</p>
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
