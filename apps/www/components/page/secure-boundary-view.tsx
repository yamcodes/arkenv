"use client";

import { useId, useState } from "react";
import { WindowChrome } from "./window-chrome";

type SecureBoundaryViewProps = {
	envHtml: string;
	bundleHtml: string;
};

type Tab = "schema" | "bundle";

export function SecureBoundaryView({
	envHtml,
	bundleHtml,
}: SecureBoundaryViewProps) {
	const [activeTab, setActiveTab] = useState<Tab>("schema");
	const baseId = useId();

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
				{/* Left Column: Window with integrated tab switcher */}
				<div className="flex flex-col gap-3 min-w-0">
					<figure
						className="home-aurora__secure-pane h-full"
						data-side={activeTab}
					>
						<div className="home-aurora__window-chrome">
							<span className="home-aurora__window-traffic" aria-hidden="true">
								<span data-tone="close" />
								<span data-tone="min" />
								<span data-tone="max" />
							</span>
							<div
								className="home-aurora__install-tabs ml-2"
								role="tablist"
								aria-label="Schema and bundle view"
							>
								<button
									type="button"
									role="tab"
									id={`${baseId}-tab-schema`}
									aria-selected={activeTab === "schema"}
									tabIndex={activeTab === "schema" ? 0 : -1}
									className="home-aurora__install-tab text-xs py-0.5"
									data-active={activeTab === "schema" ? "true" : undefined}
									onClick={() => setActiveTab("schema")}
								>
									src/env.ts
								</button>
								<button
									type="button"
									role="tab"
									id={`${baseId}-tab-bundle`}
									aria-selected={activeTab === "bundle"}
									tabIndex={activeTab === "bundle" ? 0 : -1}
									className="home-aurora__install-tab text-xs py-0.5"
									data-active={activeTab === "bundle" ? "true" : undefined}
									onClick={() => setActiveTab("bundle")}
								>
									app-client.js
								</button>
							</div>
						</div>
						<div className="relative">
							<div
								className={`home-aurora__shiki ${activeTab === "schema" ? "block" : "invisible opacity-0"}`}
								// biome-ignore lint/security/noDangerouslySetInnerHtml: static Shiki HTML from server
								dangerouslySetInnerHTML={{ __html: envHtml }}
							/>
							<div
								className={`home-aurora__shiki absolute inset-0 ${activeTab === "bundle" ? "block" : "invisible opacity-0"}`}
								// biome-ignore lint/security/noDangerouslySetInnerHtml: static Shiki HTML from server
								dangerouslySetInnerHTML={{ __html: bundleHtml }}
							/>
						</div>
					</figure>

					<div className="relative">
						<p
							className={`text-xs text-[var(--color-muted)] leading-relaxed px-1 font-sans ${activeTab === "schema" ? "block" : "invisible opacity-0 absolute inset-0"}`}
						>
							Define server & client variables in one flat schema. Non-
							<code>NEXT_PUBLIC_</code> keys are automatically identified.
						</p>
						<p
							className={`text-xs text-[var(--color-muted)] leading-relaxed px-1 font-sans ${activeTab === "bundle" ? "block" : "invisible opacity-0 absolute inset-0"}`}
						>
							Secret values like <code>DATABASE_URL</code>{" "}
							(&quot;postgresql://db...&quot;) are stripped at build time. Only
							public values reach the client.
						</p>
					</div>
				</div>

				{/* Right Column: Anchored SSR Error Overlay */}
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
