import type { Metadata } from "next";
import { AnnouncementBadge } from "~/components/announcement-badge";
import {
	AgentNativePitch,
	BeforeAfterCompare,
	BringYourOwnValidator,
	CompatibilityRails,
	HeroEndorsement,
	HeroFaq,
	InstallPanel,
	QuickstartButton,
	SecureBoundary,
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
				<div
					className="home-aurora__badge rise"
					style={{ animationDelay: "40ms" }}
				>
					<AnnouncementBadge href="docs/cli/hosting-presets" new>
						Next.js, Netlify presets
					</AnnouncementBadge>
				</div>
				<h1
					id="home-hero"
					className="home-aurora__tagline rise-blur"
					style={{ animationDelay: "120ms" }}
				>
					<span className="home-aurora__lead">The simple way to validate</span>{" "}
					<span className="home-aurora__digital home-aurora__digital-accent">
						<span className="home-aurora__digital-word">
							environment variables
						</span>
					</span>
				</h1>
				<p
					className="home-aurora__summary rise-blur"
					style={{ animationDelay: "240ms" }}
				>
					One function validates, parses, and keeps your <code>env</code> vars
					typesafe. Use ArkType, Zod, or any Standard Schema. Fail fast, ship
					faster.
				</p>
				<div className="rise" style={{ animationDelay: "320ms" }}>
					<CompatibilityRails className="home-aurora__rails-host" />
				</div>
				<div
					className="home-aurora__install-row rise"
					style={{ animationDelay: "400ms" }}
				>
					<InstallPanel />
					<StarUsButton />
					<QuickstartButton />
				</div>
				<div
					className="home-aurora__endorsement-row rise"
					style={{ animationDelay: "480ms" }}
				>
					<HeroEndorsement />
				</div>
			</section>

			<section className="home-aurora__bench" aria-label="Interactive Demo">
				<div data-reveal style={{ ["--reveal-delay" as string]: "160ms" }}>
					<VideoDemo />
				</div>
			</section>

			<BeforeAfterCompare />
			<TypeSafetyShowcase />
			<SecureBoundary />
			<BringYourOwnValidator />
			<AgentNativePitch />

			<HeroFaq />

			<section className="home-aurora__outro" aria-labelledby="home-outro">
				<h2
					id="home-outro"
					className="home-aurora__outro-title"
					data-reveal="blur"
				>
					Try ArkEnv now.
				</h2>
				<div
					className="home-aurora__install-row home-aurora__install-row--outro"
					data-reveal
					style={{ ["--reveal-delay" as string]: "80ms" }}
				>
					<InstallPanel />
					<a href="/docs/arkenv/quickstart" className="home-aurora__outro-docs">
						Read the docs
						<span aria-hidden="true">→</span>
					</a>
				</div>
			</section>

			<footer className="home-aurora__footer" data-reveal="fade">
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
						<p className="home-aurora__footer-license">MIT License</p>
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
									@yamcodes
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
						Free and open-source software · Copyright © 2025-present Yam
						Borodetsky
					</span>
				</div>
			</footer>
		</div>
	);
}
