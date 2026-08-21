"use client";

import { useId, useState } from "react";
import { HeroTwoslashHtml } from "./hero-twoslash-html";
import { InkTabList } from "./ink-tabs";
import { WindowChrome } from "./window-chrome";

type SecureBoundaryViewProps = {
	envHtml: string;
	bundleHtml: string;
};

type Tab = "schema" | "bundle";

const TABS = [
	{ id: "schema" as const, label: "src/env.ts" },
	{ id: "bundle" as const, label: "app-client.js" },
];

export function SecureBoundaryView({
	envHtml,
	bundleHtml,
}: SecureBoundaryViewProps) {
	const [activeTab, setActiveTab] = useState<Tab>("schema");
	const baseId = useId();
	const panelId = `${baseId}-panel`;
	const chromeTitle = activeTab === "schema" ? "src/env.ts" : "app-client.js";

	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-secure"
			id="secure"
		>
			<header className="home-aurora__pitch-head">
				<h2 id="home-secure" data-reveal="blur">
					Prevent accidental client leaks.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Server and client keys live in one{" "}
					<a href="/docs/guides/frameworks/nextjs">flat schema</a>. Secrets are
					stripped at build time; reading <code>DATABASE_URL</code> on the client
					throws during SSR.
				</p>
			</header>

			<div
				className="home-aurora__secure"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				<div className="home-aurora__secure-col">
					<InkTabList
						label="Schema and bundle view"
						value={activeTab}
						controls={panelId}
						onChange={setActiveTab}
						items={TABS}
					/>
					<figure className="home-aurora__code-window home-aurora__secure-pane">
						<WindowChrome title={chromeTitle} />
						<div
							className="home-aurora__secure-body"
							id={panelId}
							role="tabpanel"
						>
							<div
								data-active={activeTab === "schema" ? "true" : undefined}
								hidden={activeTab !== "schema"}
							>
								<HeroTwoslashHtml
									html={envHtml}
									active={activeTab === "schema"}
									className="home-aurora__shiki"
								/>
							</div>
							<div
								data-active={activeTab === "bundle" ? "true" : undefined}
								hidden={activeTab !== "bundle"}
							>
								<HeroTwoslashHtml
									html={bundleHtml}
									active={activeTab === "bundle"}
									className="home-aurora__shiki"
								/>
							</div>
						</div>
					</figure>
					<p className="home-aurora__validator-note">
						{activeTab === "schema" ? (
							<>
								Define server & client variables in one flat schema. Non-
								<code>NEXT_PUBLIC_</code> keys are automatically identified.
							</>
						) : (
							<>
								Secret values like <code>DATABASE_URL</code>{" "}
								(&quot;postgresql://db...&quot;) are stripped at build time.
								Only public values reach the client.
							</>
						)}
					</p>
				</div>

				<figure className="home-aurora__code-window home-aurora__secure-pane">
					<WindowChrome url="http://localhost:3000" />
					<div className="home-aurora__fail">
						<div className="home-aurora__fail-banner">
							<span className="home-aurora__fail-chip">
								Unhandled Runtime Error
							</span>
							<span className="home-aurora__fail-meta">SSR Exception</span>
						</div>
						<p className="home-aurora__fail-kicker">Uncaught Error:</p>
						<p className="home-aurora__fail-title">
							Do not access server-only key &apos;DATABASE_URL&apos; on the
							client since it will leak sensitive data (prevented by ArkEnv)
						</p>
						<div className="home-aurora__fail-stack">
							<p className="home-aurora__fail-stack-label">Call Stack</p>
							<p>
								at{" "}
								<span className="home-aurora__fail-key">
									Proxy.&lt;anonymous&gt;
								</span>{" "}
								(src/env.ts:14)
							</p>
							<p>
								at <span className="home-aurora__fail-key">Header</span>{" "}
								(app/components/header.tsx:5)
							</p>
						</div>
					</div>
				</figure>
			</div>
		</section>
	);
}
