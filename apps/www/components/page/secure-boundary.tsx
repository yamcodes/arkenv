import { highlightTs } from "./highlight-ts";
import { WindowChrome } from "./window-chrome";

const FLAT_ENV_CODE = `import arkenv from "@/generated/env.gen";

export const env = arkenv({
  NEXT_PUBLIC_API_URL: "string.url",
  DATABASE_URL: "string.url",
  STRIPE_SECRET_KEY: "string",
});`;

const COMPILED_BUNDLE_CODE = `export const env = {
  NEXT_PUBLIC_API_URL: "https://api.acme.com",
  // 🔒 Secrets omitted from client bundle!
};`;

/**
 * Client / server env boundary pitch showcasing the recommended Flat Layout.
 */
export async function SecureBoundary() {
	const [envHtml, bundleHtml] = await Promise.all([
		highlightTs(FLAT_ENV_CODE),
		highlightTs(COMPILED_BUNDLE_CODE),
	]);

	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-secure"
			id="secure"
		>
			<header className="home-aurora__pitch-head">
				<p className="home-aurora__pitch-label" data-reveal="fade">
					03 / SECURE
				</p>
				<h2 id="home-secure" data-reveal="blur">
					Keep secrets off the client.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Define a single{" "}
					<a
						href="/docs/nextjs/layouts/flat"
						className="underline decoration-cyan-500/40 underline-offset-4 hover:decoration-cyan-400"
					>
						flat schema
					</a>
					. Secrets are stripped at build time; accidental client access throws
					during SSR.
				</p>
			</header>

			<div
				className="home-aurora__secure"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				{/* Left Column: Stacked src/env.ts & Compiled JS Chunk */}
				<div className="flex flex-col gap-3 min-w-0">
					{/* src/env.ts */}
					<figure className="home-aurora__secure-pane" data-side="schema">
						<WindowChrome title="src/env.ts" />
						<div
							className="home-aurora__shiki"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: static Shiki HTML from server
							dangerouslySetInnerHTML={{ __html: envHtml }}
						/>
					</figure>

					{/* .next/static/chunks/app-client.js */}
					<figure className="home-aurora__secure-pane" data-side="bundle">
						<WindowChrome title=".next/static/chunks/app-client.js" />
						<div
							className="home-aurora__shiki"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: static Shiki HTML from server
							dangerouslySetInnerHTML={{ __html: bundleHtml }}
						/>
					</figure>

					<p className="text-xs text-[var(--color-muted)] leading-relaxed px-1 font-sans">
						Secret values like <code>DATABASE_URL</code>{" "}
						(&quot;postgresql://db...&quot;) are stripped at build time. Only
						public values reach the client.
					</p>
				</div>

				{/* Right Column: Runtime Proxy Error Overlay */}
				<figure
					className="home-aurora__secure-pane h-full flex flex-col"
					data-side="error"
				>
					<WindowChrome url="http://localhost:3000" />
					<div className="p-5 font-mono text-xs space-y-4 bg-red-950/20 text-rose-200 flex-1">
						<div className="flex items-center justify-between gap-2 border-b border-rose-900/40 pb-3">
							<span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase">
								Unhandled Runtime Error
							</span>
							<span className="text-[11px] text-zinc-500">SSR Exception</span>
						</div>
						<div className="space-y-1">
							<div className="text-zinc-400 text-[11px] font-sans">
								Uncaught Error:
							</div>
							<div className="font-semibold text-rose-100 text-sm sm:text-base leading-snug">
								ArkEnvError: Cannot access server-only key
								&quot;DATABASE_URL&quot; on client.
							</div>
						</div>
						<div className="text-zinc-400 text-xs leading-relaxed border-l-2 border-rose-500/50 pl-3 py-2 bg-black/30 rounded-r space-y-1">
							<div className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">
								Call Stack
							</div>
							<div>
								at{" "}
								<span className="text-rose-200 font-semibold">
									Proxy.&lt;anonymous&gt;
								</span>{" "}
								(src/env.ts:14)
							</div>
							<div>
								at <span className="text-rose-200 font-semibold">Header</span>{" "}
								(app/components/header.tsx:5)
							</div>
						</div>
					</div>
				</figure>
			</div>
		</section>
	);
}
