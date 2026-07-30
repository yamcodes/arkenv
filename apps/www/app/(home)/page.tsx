import { ExternalLink } from "@arkenv/fumadocs-ui/components";
import type { Metadata } from "next";
import { AnnouncementBadge } from "~/components/announcement-badge";
import {
	CompatibilityRails,
	InstallPanel,
	StarUsButton,
	VideoDemo,
} from "~/components/page";

export const metadata: Metadata = {
	title: "ArkEnv",
	description: "Environment variables toolkit built for agents",
};

export default function HomePage() {
	return (
		<div className="home-aurora__shell">
			<section className="home-aurora__intro" aria-labelledby="home-hero">
				<div className="home-aurora__badge">
					<AnnouncementBadge href="docs/nextjs/layouts/flat" new>
						Flat layout for Next.js
					</AnnouncementBadge>
				</div>
				<h1 id="home-hero" className="home-aurora__tagline">
					Environment variables toolkit{" "}
					<span className="home-aurora__digital">
						built for{" "}
						<span className="home-aurora__digital-accent">agents</span>
					</span>
					.
				</h1>
				<p className="home-aurora__summary">
					Validate, parse, and transform environment variables with your
					favorite library. Works anywhere.
				</p>
				<CompatibilityRails className="home-aurora__rails-host" />
				<div className="home-aurora__install-row">
					<InstallPanel />
					<StarUsButton />
				</div>
			</section>

			<section className="home-aurora__bench" aria-labelledby="home-bench">
				<header className="home-aurora__bench-head">
					<h2 id="home-bench">Try it live</h2>
					<p>Open the playground from the demo below.</p>
				</header>
				<VideoDemo />
			</section>

			<footer className="home-aurora__footer">
				<p className="home-aurora__footer-line">
					Proud part of the{" "}
					<ExternalLink
						href="https://arktype.io/docs/ecosystem#arkenv"
						target="_blank"
						rel="noopener noreferrer"
					>
						ArkType ecosystem
					</ExternalLink>
					.
				</p>
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
