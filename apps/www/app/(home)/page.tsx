import type { Metadata } from "next";
import { AnnouncementBadge } from "~/components/announcement-badge";
import {
	AgentNativePitch,
	BeforeAfterCompare,
	BringYourOwnValidator,
	DotGrid,
	HeroFaq,
	InstallPanel,
	QuickstartButton,
	SecureBoundary,
	SocialProof,
	StarUsButton,
	TypeSafetyShowcase,
	VideoDemo,
} from "~/components/page";
import { SiteFooter } from "~/components/site-footer";

export const metadata: Metadata = {
	title: "ArkEnv",
	description:
		"The simple way to validate environment variables — with a zero-dependency core.",
};

export default function HomePage() {
	return (
		<div className="home-aurora__shell">
			<section className="home-aurora__intro" aria-labelledby="home-hero">
				<div
					className="home-aurora__badge rise"
					style={{ animationDelay: "40ms" }}
				>
					<AnnouncementBadge href="/docs/validating-environment-variables" new>
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
					Define your <code>env</code> vars in ArkType, Zod, or any Standard
					Schema.
					<br />
					Zero runtime dependencies. Fail fast, ship faster.
				</p>
				<div
					className="home-aurora__install-row rise"
					style={{ animationDelay: "320ms" }}
				>
					<InstallPanel />
					<StarUsButton />
					<QuickstartButton />
				</div>
				<div className="rise" style={{ animationDelay: "400ms" }}>
					<SocialProof />
				</div>
			</section>

			<section
				id="demo"
				className="home-aurora__bench"
				aria-label="Interactive Demo"
			>
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
						<span className="home-aurora__outro-docs-arrow" aria-hidden="true">
							→
						</span>
					</a>
				</div>
			</section>

			<SiteFooter reveal />
		</div>
	);
}
