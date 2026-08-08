import type { Metadata } from "next";
import { AnnouncementBadge } from "~/components/announcement-badge";
import { DiscordListItem } from "~/components/discord-list-item";
import {
	AgentNativePitch,
	BeforeAfterCompare,
	BringYourOwnValidator,
	CompatibilityRails,
	DotGrid,
	HeroFaq,
	InstallPanel,
	QuickstartButton,
	SecureBoundary,
	StarUsButton,
	TypeSafetyShowcase,
	VideoDemo,
} from "~/components/page";
import { Logo } from "~/components/page/logo";
import { getGithubRepoUrl } from "~/lib/github-links";

export const metadata: Metadata = {
	title: "ArkEnv",
	description: "The simple way to validate environment variables.",
};

export default function HomePage() {
	const githubRepoUrl = getGithubRepoUrl();

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
				<div className="home-aurora__outro-atmosphere" aria-hidden="true">
					<DotGrid />
				</div>
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
					<a href="/docs/getting-started" className="home-aurora__outro-docs">
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
					</div>

					<nav aria-labelledby="footer-resources">
						<h3 id="footer-resources">Resources</h3>
						<ul>
							<li>
								<a
									href="https://stackblitz.com/github/yamcodes/arkenv/tree/main/examples/stackblitz?file=index.ts"
									target="_blank"
									rel="noopener noreferrer"
								>
									Live demo
								</a>
							</li>
							<li>
								<a
									href={`${githubRepoUrl}/releases`}
									target="_blank"
									rel="noopener noreferrer"
								>
									Releases
								</a>
							</li>
							<li>
								<a href="/docs">Docs</a>
							</li>
							<li>
								<a href="/#faq">FAQ</a>
							</li>
						</ul>
					</nav>

					<nav aria-labelledby="footer-integrations">
						<h3 id="footer-integrations">Integrations</h3>
						<ul>
							<li>
								<a href="/docs/getting-started/editor-integration">IDE</a>
							</li>
							<li>
								<a href="/docs/reference/init">Terminal</a>
							</li>
							<li>
								<a
									href="https://arktype.io/docs/ecosystem#arkenv"
									target="_blank"
									rel="noopener noreferrer"
								>
									ArkType
								</a>
							</li>
							<li>
								<a href="/docs/core-concepts/standard-schema">
									Standard Schema
								</a>
							</li>
						</ul>
					</nav>

					<nav aria-labelledby="footer-elsewhere">
						<h3 id="footer-elsewhere">Elsewhere</h3>
						<ul>
							<li>
								<a
									href={githubRepoUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									GitHub
								</a>
							</li>
							<li>
								<a
									href="https://www.npmjs.com/package/@arkenv/core"
									target="_blank"
									rel="noopener noreferrer"
								>
									npm
								</a>
							</li>
							<li>
								<a
									href="https://www.skills.sh/yamcodes/arkenv/arkenv"
									target="_blank"
									rel="noopener noreferrer"
								>
									Skills
								</a>
							</li>
							<li>
								<a
									href="https://x.com/_yamcodes"
									target="_blank"
									rel="noopener noreferrer"
								>
									X
								</a>
							</li>
							<DiscordListItem />
						</ul>
					</nav>
				</div>

				<div className="home-aurora__footer-meta">
					<span>
						Free and open-source under the{" "}
						<a
							href={`${githubRepoUrl}/blob/dev/LICENSE`}
							target="_blank"
							rel="noopener noreferrer"
						>
							MIT License
						</a>
					</span>
					<span>
						© 2025-present{" "}
						<a
							href="https://yam.codes"
							target="_blank"
							rel="noopener noreferrer"
						>
							Yam Borodetsky
						</a>
					</span>
				</div>
			</footer>
		</div>
	);
}
