import type { Metadata } from "next";
import { AnnouncementBadge } from "~/components/announcement-badge";
import {
	AgentNativePitch,
	BeforeAfterCompare,
	BringYourOwnValidator,
	DotGrid,
	HeroEnvHoverSlot,
	HeroFaq,
	HeroMvpExampleSlot,
	HeroNameCycle,
	HeroPlaygroundProvider,
	InstallPanel,
	QuickstartButton,
	SecureBoundary,
	SocialProof,
	StarUsButton,
	TypeSafetyShowcase,
	VideoDemo,
	WorksWith,
} from "~/components/page";
import { SiteFooter } from "~/components/site-footer";

export const metadata: Metadata = {
	title: "ArkEnv - TypeScript environment variables",
	description:
		"Typesafe environment variables for ArkType, Zod, Valibot, and any Standard Schema.",
};

export default function HomePage() {
	return (
		<div className="home-aurora__shell">
			<section className="home-aurora__intro" aria-labelledby="home-hero">
				<HeroPlaygroundProvider>
					<div className="home-aurora__hero-copy">
						<div
							className="home-aurora__badge rise"
							style={{ animationDelay: "40ms" }}
						>
							<AnnouncementBadge href="/docs/validating-your-environment" new>
								Next.js, Netlify presets
							</AnnouncementBadge>
						</div>
						<h1 id="home-hero" className="home-aurora__tagline">
							<span
								className="home-aurora__lead rise-blur"
								style={{ animationDelay: "120ms" }}
							>
								Typesafe environment variables
								<span className="home-aurora__lead-with">
									with <HeroNameCycle />
								</span>
							</span>
						</h1>
						<p
							className="home-aurora__summary rise-blur"
							style={{ animationDelay: "520ms" }}
						>
							Write a schema in your existing TypeScript validator. Get a
							strictly typed <HeroEnvHoverSlot /> object. No boilerplate. Zero
							runtime dependencies.
						</p>
					</div>
					<div
						className="home-aurora__hero-example rise"
						style={{ animationDelay: "280ms" }}
					>
						<HeroMvpExampleSlot />
					</div>
					<div className="home-aurora__hero-ctas">
						<div
							className="home-aurora__install-row rise"
							style={{ animationDelay: "640ms" }}
						>
							<InstallPanel />
							<StarUsButton />
							<QuickstartButton />
						</div>
						<div className="rise" style={{ animationDelay: "760ms" }}>
							<SocialProof />
						</div>
					</div>
				</HeroPlaygroundProvider>
			</section>

			<WorksWith />

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
					<a href="/docs" className="home-aurora__outro-docs">
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
