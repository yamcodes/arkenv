import type { Metadata } from "next";
import { AnnouncementBadge } from "~/components/announcement-badge";
import {
	AgentNativePitch,
	BeforeAfterCompare,
	CompatibilityRails,
	InstallPanel,
	QuickstartButton,
	StarUsButton,
	TypeSafetyShowcase,
	VideoDemo,
} from "~/components/page";
import { Logo } from "~/components/page/logo";

export const metadata: Metadata = {
	title: "ArkEnv",
	description: "The simple way to validate environment variables.",
};

export default function HomePage() {
	return (
		<div className="home-aurora__shell">
			<section className="home-aurora__intro" aria-labelledby="home-hero">
				<div className="home-aurora__badge">
					<AnnouncementBadge href="docs/cli/hosting-presets" new>
						Next.js, Netlify presets
					</AnnouncementBadge>
				</div>
				<h1 id="home-hero" className="home-aurora__tagline">
					<span className="home-aurora__lead">The simple way to validate</span>{" "}
					<span className="home-aurora__digital home-aurora__digital-accent">
						environment{" "}
						<span className="home-aurora__digital-word">variables</span>
					</span>
				</h1>
				<p className="home-aurora__summary">
					One function for validated, parsed, and typesafe env vars. Works with
					ArkType, Zod, Valibot, or any Standard Schema. Start from the CLI, or
					let your agent handle it.
				</p>
				<CompatibilityRails className="home-aurora__rails-host" />
				<div className="home-aurora__install-row">
					<InstallPanel />
					<StarUsButton />
					<QuickstartButton />
				</div>
			</section>

			<BeforeAfterCompare />
			<TypeSafetyShowcase />
			<AgentNativePitch />

			<section className="home-aurora__bench" aria-labelledby="home-bench">
				<header className="home-aurora__bench-head">
					<h2 id="home-bench">Try it live</h2>
					<p>Open the playground from the demo below.</p>
				</header>
				<VideoDemo />
			</section>

			<footer className="home-aurora__footer">
				<div className="home-aurora__footer-grid">
					<div className="home-aurora__footer-brand">
						<a
							href="/"
							className="home-aurora__wordmark"
							aria-label="ArkEnv home"
						>
							<Logo />
						</a>
						<p>The simple way to validate environment variables.</p>
						<p className="home-aurora__footer-license">
							MIT License · Open Source
						</p>
					</div>

					<nav aria-labelledby="footer-resources">
						<h3 id="footer-resources">Resources</h3>
						<ul>
							<li>
								<a href="/docs/arkenv">Documentation</a>
							</li>
							<li>
								<a href="/docs/arkenv/quickstart">Quick Start</a>
							</li>
							<li>
								<a href="/docs/nextjs">Next.js</a>
							</li>
							<li>
								<a href="/docs/cli/hosting-presets">Hosting presets</a>
							</li>
						</ul>
					</nav>

					<nav aria-labelledby="footer-ecosystem">
						<h3 id="footer-ecosystem">Ecosystem</h3>
						<ul>
							<li>
								<a
									href="https://github.com/yamcodes/arkenv"
									target="_blank"
									rel="noopener noreferrer"
								>
									GitHub
								</a>
							</li>
							<li>
								<a
									href="https://www.npmjs.com/package/arkenv"
									target="_blank"
									rel="noopener noreferrer"
								>
									npm
								</a>
							</li>
							<li>
								<a
									href="https://github.com/yamcodes/arkenv/releases"
									target="_blank"
									rel="noopener noreferrer"
								>
									Releases
								</a>
							</li>
							<li>
								<a
									href="https://arktype.io/docs/ecosystem#arkenv"
									target="_blank"
									rel="noopener noreferrer"
								>
									ArkType ecosystem
								</a>
							</li>
						</ul>
					</nav>

					<nav aria-labelledby="footer-community">
						<h3 id="footer-community">Community</h3>
						<ul>
							<li>
								<a
									href="https://github.com/sponsors/yamcodes"
									target="_blank"
									rel="noopener noreferrer"
								>
									Sponsor
								</a>
							</li>
							<li>
								<a
									href="https://yam.codes"
									target="_blank"
									rel="noopener noreferrer"
								>
									Created by Yam
								</a>
							</li>
							<li>
								<a
									href="https://discord.gg/zAmUyuxXH9"
									target="_blank"
									rel="noopener noreferrer"
								>
									Discord
								</a>
							</li>
						</ul>
					</nav>
				</div>

				<div className="home-aurora__footer-meta">
					<span className="home-aurora__wordmark">ArkEnv</span>
					<span>
						Released under the MIT License · Copyright © 2025-present Yam
						Borodetsky
					</span>
				</div>
			</footer>
		</div>
	);
}
