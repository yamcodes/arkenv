import type { Metadata } from "next";
import { AnnouncementBadge } from "~/components/announcement-badge";
import {
	AutocompleteShowcase,
	BringYourOwnValidator,
	DotGrid,
	FailFastShowcase,
	HeroEnvHoverSlot,
	HeroMvpExampleSlot,
	HeroNameCycle,
	HeroPlaygroundProvider,
	InstallPanel,
	QuickstartButton,
	SecureBoundary,
	SocialProof,
	StarUsButton,
	WorksWith,
} from "~/components/page";
import { SiteFooter } from "~/components/site-footer";

export const metadata: Metadata = {
	title: "ArkEnv - Typesafe environment variables for TypeScript",
	description:
		"Typesafe environment variables with ArkType, Zod, Valibot, or any Standard Schema. Get a strictly typed env object using your existing TypeScript validator. No boilerplate. Zero runtime dependencies.",
};

export default function HomePage() {
	return (
		<div className="home-aurora__shell">
			<div className="home-aurora__rails" aria-hidden="true" />
			<section className="home-aurora__intro" aria-labelledby="home-hero">
				<HeroPlaygroundProvider>
					<div
						className="home-aurora__badge rise"
						style={{ animationDelay: "40ms" }}
					>
						<AnnouncementBadge
							href="/docs/validating-your-environment/hosting-presets"
							new
						>
							Vercel, Netlify & Cloudflare presets
						</AnnouncementBadge>
					</div>
					<div className="home-aurora__hero-copy">
						<h1 id="home-hero" className="home-aurora__tagline">
							<span
								className="home-aurora__lead rise-blur"
								style={{ animationDelay: "120ms" }}
							>
								Typesafe environment variables
								<br />
								<span className="home-aurora__lead-with">
									<HeroNameCycle />
								</span>
							</span>
						</h1>
						<p
							className="home-aurora__summary rise-blur"
							style={{ animationDelay: "520ms" }}
						>
							Get a strictly typed <HeroEnvHoverSlot /> object using your
							existing TypeScript validator. No boilerplate. Zero runtime
							dependencies.
						</p>
					</div>
					<div className="home-aurora__hero-ctas">
						<div
							className="home-aurora__install-row rise"
							style={{ animationDelay: "640ms" }}
						>
							<InstallPanel />
							<QuickstartButton />
							<StarUsButton />
						</div>
					</div>
					<div
						className="home-aurora__hero-example rise"
						style={{ animationDelay: "280ms" }}
					>
						<HeroMvpExampleSlot />
					</div>
					<div
						className="home-aurora__trust rise"
						style={{ animationDelay: "760ms" }}
					>
						<SocialProof />
						<WorksWith />
					</div>
				</HeroPlaygroundProvider>
			</section>

			<div className="home-aurora__bento">
				<FailFastShowcase />
				<AutocompleteShowcase />
				<SecureBoundary />
				<BringYourOwnValidator />
			</div>

			<div className="home-aurora__stripe" aria-hidden="true" />

			<div className="home-aurora__bento home-aurora__bento--solo">
				<section
					className="home-aurora__pitch home-aurora__pitch--span home-aurora__outro"
					aria-labelledby="home-outro"
				>
					<div className="home-aurora__outro-atmosphere" aria-hidden="true">
						<DotGrid />
					</div>
					<div className="home-aurora__outro-copy" data-reveal="blur">
						<h2 id="home-outro" className="home-aurora__outro-title">
							Start validating with ArkEnv
						</h2>
					</div>
					<div
						className="home-aurora__outro-cta"
						data-reveal
						style={{ ["--reveal-delay" as string]: "80ms" }}
					>
						<InstallPanel variant="outro" />
					</div>
				</section>
			</div>

			<SiteFooter reveal />
		</div>
	);
}
