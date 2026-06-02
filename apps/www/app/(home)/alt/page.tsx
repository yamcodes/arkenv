import { ExternalLink } from "@arkenv/fumadocs-ui/components";
import type { Metadata } from "next";
import {
	CLICommand,
	CodeFrame,
	CompatibilityRails,
	QuickstartButton,
} from "~/components/page";
import "~/app/styles/alt.css";

export const metadata: Metadata = {
	title: "ArkEnv — typesafe env vars",
	description: "Environment variable validation from editor to runtime",
};

const headline = "Your env vars. Fully typed.".split(" ");
const subheadline =
	"Type-safe environment variable validation from editor to deployment.";

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

export default withArkEnv(nextConfig, env);

// Build-time validation.
// Client/server boundary enforcement.
// Editor autocomplete — every variable.`;

const sectionHeadline = (text: string) => text.split(" ");

export default function AltHomePage() {
	return (
		<div id="alt-root" className="flex flex-1 flex-col" style={{ backgroundColor: "var(--color-paper)" }}>
			{/* Hero — Stacked title + code panel */}
			<section
				className="w-full flex items-center"
				style={{
					minHeight: "calc(100dvh - var(--fd-nav-height, 80px))",
					paddingBlock: "var(--space-3xl) var(--space-2xl)",
				}}
			>
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
					<div className="alt-hero-grid grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
						<div className="min-w-0">
							<h1
								className="font-semibold tracking-tighter leading-[1.06] mb-6 overflow-wrap-anywhere min-w-0"
								style={{
									fontFamily: "var(--font-display)",
									fontSize: "clamp(2.5rem, 5vw + 0.5rem, 4.5rem)",
									color: "var(--color-ink)",
									letterSpacing: "-0.03em",
								}}
							>
								{headline.map((word, i) => (
									<span
										key={word}
										className="alt-hero-word"
										style={{ animationDelay: `${0.1 + i * 0.08}s` }}
									>
										{i > 0 && " "}{word}
									</span>
								))}
							</h1>
							<p
								className="text-base sm:text-lg max-w-xl leading-relaxed mb-8"
								style={{ color: "var(--color-ink-3)" }}
							>
								{subheadline}
							</p>
							<div className="flex flex-wrap items-center gap-3">
								<QuickstartButton />
								<CLICommand />
							</div>
						</div>
						<div className="min-w-0">
							<div className="alt-panel alt-grain">
								<CodeFrame
									label="env.ts"
									code={envTsCode}
									language="ts"
									caption=""
								/>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Three value props (FIG 0.1–0.3) */}
			<section
				className="w-full"
				style={{
					paddingBlock: "var(--space-2xl)",
					borderTop: "1px solid var(--color-rule)",
				}}
			>
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="alt-fig-grid grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12">
						{[
							{ fig: "0.1", label: "Declare", heading: "One schema.", body: "Define your env vars once. TypeScript automatically infers every variable's type — no codegen step required." },
							{ fig: "0.2", label: "Validate", heading: "Every boundary.", body: "Build-time checks catch missing vars before deploy. Runtime validation guards against config drift in production." },
							{ fig: "0.3", label: "Integrate", heading: "Your stack.", body: "Plug into Next.js, Vite, Bun, or any framework. CLI init, CI checks, editor autocomplete — zero ceremony." },
						].map((item) => (
							<div key={item.fig} className="min-w-0">
								<div className="alt-fig-label mb-4">{item.fig} · {item.label}</div>
								<h3
									className="text-xl font-semibold tracking-tight mb-2"
									style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
								>
									{item.heading}
								</h3>
								<p className="text-sm leading-relaxed" style={{ color: "var(--color-ink-3)" }}>
									{item.body}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* 1.0 · Schema */}
			<section className="w-full alt-workbench-section" style={{ borderTop: "1px solid var(--color-rule)", paddingBlock: "var(--space-2xl)" }}>
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="alt-section-grid grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
						<div className="min-w-0 order-last lg:order-first" style={{ maxWidth: "32rem" }}>
							<div className="alt-panel alt-grain">
								<CodeFrame label="env.ts" code={envTsCode} language="ts" caption="" />
							</div>
						</div>
						<div className="min-w-0">
							<div className="alt-section-number mb-4">1.0</div>
							<h2
								className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight mb-3"
								style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
							>
								{sectionHeadline("Declare once. Infer everywhere.").map((word, i) => (
									<span key={word}>{i > 0 && " "}{word}</span>
								))}
							</h2>
							<p className="text-sm leading-relaxed mb-6 max-w-prose" style={{ color: "var(--color-ink-3)" }}>
								Write your schema in a single `env.ts` file. ArkEnv wraps ArkType's inference
								to give you full autocomplete across every framework — with zero runtime
								dependencies and no build step.
							</p>
							<a
								href="/docs/arkenv/quickstart"
								className="alt-btn-primary"
							>
								Read the docs
								<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
									<path d="M1 7h10m0 0L7 3m4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* 2.0 · Plugins */}
			<section className="w-full alt-workbench-section" style={{ borderTop: "1px solid var(--color-rule)", paddingBlock: "var(--space-2xl)" }}>
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="alt-section-grid grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
						<div className="min-w-0">
							<div className="alt-section-number mb-4">2.0</div>
							<h2
								className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight mb-3"
								style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
							>
								One plugin. Every framework.
							</h2>
							<p className="text-sm leading-relaxed mb-6 max-w-prose" style={{ color: "var(--color-ink-3)" }}>
								Drop in a single plugin per framework. Build-time env validation, client/server
								boundary enforcement, and full type inference — no config files, no runtime
								overhead.
							</p>
							<CodeFrame
								label="next.config.ts"
								code={pluginCode}
								language="ts"
								caption=""
							/>
						</div>
						<div className="min-w-0">
							<div className="alt-panel" style={{ padding: "var(--space-lg)" }}>
								<h3
									className="text-sm font-semibold tracking-tight mb-4"
									style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
								>
									Compatible with
								</h3>
								<CompatibilityRails className="max-w-full mx-0" />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* 3.0 · Ship */}
			<section className="w-full alt-workbench-section" style={{ borderTop: "1px solid var(--color-rule)", paddingBlock: "var(--space-2xl)" }}>
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="alt-section-grid grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
						<div className="min-w-0 order-last lg:order-first">
							<div className="alt-panel alt-grain" style={{ padding: "var(--space-lg)", maxWidth: "32rem" }}>
								<div style={{ color: "var(--color-ink-4)", fontSize: "0.75rem", fontFamily: "JetBrains Mono, monospace", marginBottom: "var(--space-md)", fontFeatureSettings: '"ss01"' }}>
									$ npx @arkenv/cli@latest check
								</div>
								<div style={{ color: "var(--color-ink-3)", fontSize: "0.8125rem", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.6 }}>
									<span style={{ color: "var(--color-emphasis)" }}>✓</span> API_URL is set<br />
									<span style={{ color: "var(--color-emphasis)" }}>✓</span> AUTH_SECRET is set<br />
									<span style={{ color: "var(--color-emphasis)" }}>✓</span> DATABASE_URL is set<br />
									<span style={{ color: "var(--color-ink-4)" }}>────</span><br />
									<span style={{ color: "var(--color-ink-4)" }}>All 12 variables resolved.</span>
								</div>
							</div>
						</div>
						<div className="min-w-0">
							<div className="alt-section-number mb-4">3.0</div>
							<h2
								className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight mb-3"
								style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
							>
								Ship with confidence.
							</h2>
							<p className="text-sm leading-relaxed mb-6 max-w-prose" style={{ color: "var(--color-ink-3)" }}>
								CI checks catch missing or misconfigured env vars before they reach production.
								CLI, editor, and runtime — every layer validates the same schema.
							</p>
							<a
								href="/docs/arkenv/quickstart"
								className="alt-btn-primary"
							>
								Get started
								<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
									<path d="M1 7h10m0 0L7 3m4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* Proof — trust bar */}
			<section style={{ borderTop: "1px solid var(--color-rule)", paddingBlock: "var(--space-xl)" }}>
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs" style={{ color: "var(--color-ink-4)" }}>
						<span className="flex items-center gap-1.5">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
							</svg>
							Open source — MIT
						</span>
						<ExternalLink href="https://arktype.io/docs/ecosystem#arkenv">
							ArkType Ecosystem →
						</ExternalLink>
						<ExternalLink href="https://github.com/yamcodes/arkenv">
							GitHub →
						</ExternalLink>
						<ExternalLink href="/docs/arkenv">
							Documentation →
						</ExternalLink>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section style={{ borderTop: "1px solid var(--color-rule)", paddingBlock: "var(--space-2xl)" }}>
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="alt-cta-card text-center max-w-2xl mx-auto">
						<h2
							className="text-xl sm:text-2xl font-semibold tracking-tight mb-3"
							style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
						>
							Typesafe env vars. From editor to runtime.
						</h2>
						<p className="text-sm mb-6" style={{ color: "var(--color-ink-3)" }}>
							Zero setup. Zero runtime overhead. Full autocomplete.
						</p>
						<div className="flex flex-wrap items-center justify-center gap-3">
							<QuickstartButton />
							<CLICommand />
						</div>
					</div>
				</div>
			</section>

			{/* Footer — Ft2 Inline single line */}
			<footer
				className="w-full alt-footer"
				style={{
					paddingBlock: "var(--space-lg)",
					backgroundColor: "var(--color-paper)",
				}}
			>
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs" style={{ color: "var(--color-ink-4)" }}>
						<div className="flex items-center gap-2">
							<svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
								<path fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" d="M8.5 6c0-1.379-1.121-2.5-2.5-2.5A2.502 2.502 0 0 0 3.5 6c0 1.379 1.121 2.5 2.5 2.5S8.5 7.379 8.5 6ZM6 11V8.5M1 6h2.5m5 0H11M6 3.5V1M2.464 2.464l1.768 1.768m3.536 3.536 1.768 1.768m-7.072 0 1.768-1.768m3.536-3.536 1.768-1.768" />
								<circle cx="6" cy="6" r="0.9" fill="currentColor" />
							</svg>
							<span className="font-medium" style={{ color: "var(--color-ink-3)" }}>ArkEnv</span>
						</div>
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
							<span>MIT License</span>
							<span aria-hidden="true">·</span>
							<span>&copy; 2025–present Yam Borodetsky</span>
							<span aria-hidden="true">·</span>
							<ExternalLink
								href="https://arktype.io/docs/ecosystem#arkenv"
								target="_blank"
								rel="noopener noreferrer"
							>
								ArkType Ecosystem
							</ExternalLink>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
