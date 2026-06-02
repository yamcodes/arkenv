import { ExternalLink } from "@arkenv/fumadocs-ui/components";
import type { Metadata } from "next";
import {
	CLICommand,
	CodeFrame,
	CompatibilityRails,
	QuickstartButton,
	VideoDemo,
} from "~/components/page";

export const metadata: Metadata = {
	title: "ArkEnv",
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
			{/* Hero — Split Diptych: text left, code right */}
			<section className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center"
				style={{
					minHeight: "calc(100dvh - var(--fd-nav-height, 80px))",
					paddingBlock: "var(--space-xl)",
				}}
			>
				<div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-10 lg:gap-16 items-center w-full">
					<div className="min-w-0">
						<h1
							className="font-semibold tracking-tighter leading-[1.06] mb-4 overflow-wrap-anywhere min-w-0"
							style={{
								fontFamily: "var(--font-display)",
								fontSize: "var(--text-display)",
								color: "var(--color-ink)",
							}}
						>
							Better{" "}
							<span style={{ color: "var(--color-brand)" }}>typesafe</span>{" "}
							than sorry.
						</h1>
						<p
							className="text-lg sm:text-xl mt-3 max-w-xl leading-relaxed mb-6"
							style={{ color: "var(--color-ink-2)" }}
						>
							Environment variable validation from editor to runtime.
						</p>
						<div className="flex flex-wrap items-center gap-3">
							<QuickstartButton />
							<CLICommand />
						</div>
					</div>
					<div className="min-w-0">
						<CodeFrame
							label="env.ts"
							code={envTsCode}
							language="ts"
							caption="Declare your schema once. Full autocomplete — everywhere."
						/>
					</div>
				</div>
			</section>

			{/* Diptych row — reversed: proof left, text right */}
			<section
				className="w-full"
				style={{
					paddingBlock: "var(--space-3xl)",
					borderTop: "1px solid var(--color-rule)",
				}}
			>
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-10 lg:gap-16 items-center">
						<div className="min-w-0">
							<CodeFrame
								label="next.config.ts"
								code={pluginCode}
								language="ts"
								caption="One plugin. Build-time validation. Zero runtime overhead."
							/>
						</div>
						<div className="min-w-0">
							<h2
								className="font-semibold tracking-tight leading-tight mb-3"
								style={{
									fontFamily: "var(--font-display)",
									fontSize: "var(--text-2xl)",
									color: "var(--color-ink)",
								}}
							>
								One plugin. Every framework.
							</h2>
							<p
								className="max-w-prose leading-relaxed mb-4"
								style={{
									fontSize: "var(--text-md)",
									color: "var(--color-ink-2)",
								}}
							>
								Wrap your config in a single line. ArkEnv validates at
								build time, enforces client/server boundaries, and gives
								your editor full autocomplete for every variable — with
								zero runtime overhead.
							</p>
							<div className="mt-6">
								<CompatibilityRails className="max-w-full mx-0" />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Diptych row — text left, proof right */}
			<section
				className="w-full"
				style={{
					paddingBlock: "var(--space-2xl)",
					borderTop: "1px solid var(--color-rule)",
				}}
			>
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-10 lg:gap-16 items-center">
						<div className="min-w-0">
							<h2
								className="font-semibold tracking-tight leading-tight mb-3"
								style={{
									fontFamily: "var(--font-display)",
									fontSize: "var(--text-2xl)",
									color: "var(--color-ink)",
								}}
							>
								See it in action.
							</h2>
							<p
								className="max-w-prose leading-relaxed mb-4"
								style={{
									fontSize: "var(--text-md)",
									color: "var(--color-ink-2)",
								}}
							>
								Every variable typed. Every path checked. Open a
								playground and try it yourself — zero setup.
							</p>
						</div>
						<div className="min-w-0">
							<VideoDemo />
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section
				className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
				style={{
					paddingBlock: "var(--space-2xl)",
					borderTop: "1px solid var(--color-rule)",
				}}
			>
				<p
					className="text-lg sm:text-xl mb-5 font-medium"
					style={{
						fontFamily: "var(--font-display)",
						color: "var(--color-ink)",
					}}
				>
					Ship typesafe env vars — from editor to runtime.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3">
					<QuickstartButton />
					<CLICommand />
				</div>
			</section>

			{/* Footer — Ft2 Inline single line */}
			<footer
				className="w-full px-4 sm:px-6 lg:px-8"
				style={{
					paddingBlock: "var(--space-lg)",
					borderTop: "1px solid var(--color-rule)",
					backgroundColor: "var(--color-paper)",
				}}
			>
				<div
					className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
					style={{ color: "var(--color-ink-2)" }}
				>
					<div className="flex items-center gap-2">
						<svg
							width="14"
							height="14"
							viewBox="0 0 12 12"
							aria-hidden="true"
							className="opacity-50"
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
			</footer>
		</div>
	);
}
