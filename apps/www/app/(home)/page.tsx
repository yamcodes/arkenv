import { ExternalLink } from "@arkenv/fumadocs-ui/components";
import type { Metadata } from "next";
import { AnnouncementBadge } from "~/components/announcement-badge";
import { HeroGradientOverlay } from "~/components/hero-gradient-overlay";
import { HeroVisual } from "~/components/hero-visual";
import {
	CLICommand,
	CodeFrame,
	CompatibilityRails,
	QuickstartButton,
	StarUsButton,
	VideoDemo,
} from "~/components/page";

export const metadata: Metadata = {
	title: "ArkEnv",
	description: "Environment variable validation from editor to runtime",
};

const envTsCode = `import { arkenv } from "arkenv";

const env = arkenv({
  PORT:     "number",
  API_KEY:  "string",
  DATABASE_URL: "string",
  NODE_ENV: "'development' | 'production'",
});

// env.PORT is typed as number
// env.NODE_ENV is typed as "development" | "production"`;

const pluginCode = `// next.config.ts
import { arkenv } from "arkenv";
import { withArkEnv } from "@arkenv/nextjs";

const env = arkenv({
  API_URL: "string",
  AUTH_SECRET: "string",
});

export default withArkEnv(nextConfig, env);

// Build-time validation.
// Client/server boundary enforcement.
// Editor autocomplete for every variable.`;

export default function HomePage() {
	return (
		<div
			className="flex flex-1 flex-col"
			style={{ backgroundColor: "var(--color-paper)" }}
		>
			<HeroGradientOverlay />

			{/* Compact hero */}
			<section className="relative z-10 w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24">
				<div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-16">
					<div className="flex-1 min-w-0">
						<div className="mb-4">
							<AnnouncementBadge href="docs/nextjs" new>
								Official Next.js integration!
							</AnnouncementBadge>
						</div>
						<h1
							className="text-[--text-display] font-semibold tracking-tighter leading-[1.08] mb-3 overflow-wrap-anywhere min-w-0"
							style={{ color: "var(--color-ink)" }}
						>
							Better{" "}
							<span style={{ color: "var(--color-brand)" }}>typesafe</span> than
							sorry
						</h1>
						<p
							className="text-lg sm:text-xl mt-3 max-w-xl leading-relaxed"
							style={{ color: "var(--color-ink-2)" }}
						>
							Environment variable validation from editor to runtime
						</p>
						<div className="flex flex-wrap items-center gap-3 mt-6">
							<QuickstartButton />
							<CLICommand />
						</div>
					</div>
					<div className="hidden lg:block flex-1 w-full max-w-lg mx-auto lg:mx-0">
						<HeroVisual />
					</div>
				</div>
			</section>

			{/* Compatibility rails */}
			<section className="w-full mt-12 sm:mt-16 lg:mt-20">
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
					<CompatibilityRails className="max-w-full mx-0" />
				</div>
			</section>

			{/* Screenshot block 1: env.ts */}
			<section
				className="w-full mt-16 sm:mt-20 lg:mt-24 px-4 sm:px-6 lg:px-8"
				style={{ paddingBlock: "var(--space-3xl)" }}
			>
				<div className="max-w-screen-xl mx-auto">
					<CodeFrame
						label="env.ts"
						code={envTsCode}
						language="ts"
						caption="Declare your schema once. Full autocomplete — everywhere."
					/>
				</div>
			</section>

			{/* Platform divider — compatibility rails as full-width interlude */}
			<section
				className="w-full py-12 sm:py-16"
				style={{
					borderBlock: "1px solid var(--color-rule)",
				}}
			>
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
					<p
						className="text-xs font-medium tracking-widest uppercase mb-4 text-center"
						style={{ color: "var(--color-ink-2)" }}
					>
						Works with your stack
					</p>
					<CompatibilityRails className="max-w-full mx-0" />
				</div>
			</section>

			{/* Screenshot block 2: Framework integration */}
			<section
				className="w-full px-4 sm:px-6 lg:px-8"
				style={{ paddingBlock: "var(--space-3xl)" }}
			>
				<div className="max-w-screen-xl mx-auto">
					<CodeFrame
						label="next.config.ts"
						code={pluginCode}
						language="ts"
						caption="One plugin. Build-time validation. Zero runtime overhead."
					/>
				</div>
			</section>

			{/* Video demo — the richest "screenshot" */}
			<section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
				<VideoDemo />
			</section>

			{/* GitHub stats — numbered proof */}
			<section
				className="w-full px-4 sm:px-6 lg:px-8"
				style={{ paddingBlock: "var(--space-2xl)" }}
			>
				<div className="max-w-screen-xl mx-auto">
					<StarUsButton />
					<div className="hidden sm:flex items-center justify-center gap-6 mt-6 text-sm">
						<a
							href="https://github.com/yamcodes/arkenv"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 transition-colors"
							style={{ color: "var(--color-ink-2)" }}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
							>
								<title>GitHub</title>
								<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
							</svg>
							<span>Star us on GitHub</span>
						</a>
						<span
							className="inline-flex items-center gap-1 text-sm"
							style={{ color: "var(--color-ink-2)" }}
						>
							Part of the{" "}
							<ExternalLink
								href="https://arktype.io/docs/ecosystem#arkenv"
								target="_blank"
								rel="noopener noreferrer"
							>
								ArkType ecosystem
							</ExternalLink>
						</span>
					</div>
				</div>
			</section>

			{/* Sticky CTA bar */}
			<aside
				className="sticky bottom-0 w-full z-[--z-sticky] py-3 px-4 sm:px-6 lg:px-8 backdrop-blur-md border-t"
				style={{
					backgroundColor:
						"color-mix(in oklch, var(--color-paper) 85%, transparent)",
					borderColor: "var(--color-rule)",
				}}
			>
				<div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
					<p
						className="hidden sm:block text-sm font-medium"
						style={{ color: "var(--color-ink)" }}
					>
						Ship typesafe env vars — from editor to runtime.
					</p>
					<QuickstartButton />
				</div>
			</aside>

			{/* Footer */}
			<footer
				className="w-full py-10 px-4 sm:px-6 lg:px-8 border-t"
				style={{
					borderColor: "var(--color-rule)",
					backgroundColor: "var(--color-paper)",
				}}
			>
				<div
					className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
					style={{ color: "var(--color-ink-2)" }}
				>
					<div className="flex items-center gap-2">
						<svg
							width="18"
							height="18"
							viewBox="0 0 12 12"
							aria-hidden="true"
							className="opacity-60"
						>
							<path
								fill="none"
								stroke="currentColor"
								strokeWidth="0.9"
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M8.5 6c0-1.379-1.121-2.5-2.5-2.5A2.502 2.502 0 0 0 3.5 6c0 1.379 1.121 2.5 2.5 2.5S8.5 7.379 8.5 6ZM6 11V8.5M1 6h2.5m5 0H11M6 3.5V1M2.464 2.464l1.768 1.768m3.536 3.536 1.768 1.768m-7.072 0 1.768-1.768m3.536-3.536 1.768-1.768"
							/>
							<circle cx="6" cy="6" r="0.9" fill="currentColor" />
						</svg>
						<span className="font-medium">ArkEnv</span>
					</div>
					<div className="flex items-center gap-3 text-xs">
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
			</footer>
		</div>
	);
}
