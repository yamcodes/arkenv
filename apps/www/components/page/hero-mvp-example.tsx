import { Suspense } from "react";
import { HeroMvpExampleView } from "./hero-mvp-example-view";
import { HeroMvpValidatorMark } from "./hero-mvp-marks";
import { HERO_MVP_VALIDATORS } from "./hero-mvp-snippets";
import { highlightHeroMvpExamples } from "./highlight-hero-twoslash";
import { WindowChrome } from "./window-chrome";

function HeroMvpExampleFallback() {
	return (
		<div className="home-aurora__mvp" aria-hidden="true">
			<div className="home-aurora__tabs">
				<div className="home-aurora__tabs-list">
					{HERO_MVP_VALIDATORS.map((item) => (
						<span
							key={item.id}
							className="home-aurora__tab"
							data-active={item.id === "arktype" ? "true" : undefined}
						>
							<HeroMvpValidatorMark id={item.id} />
							{item.label}
						</span>
					))}
				</div>
			</div>
			<figure className="home-aurora__code-window home-aurora__mvp-frame">
				<WindowChrome title="./env.ts" />
				<div className="home-aurora__mvp-body home-aurora__mvp-body--pending" />
			</figure>
		</div>
	);
}

/**
 * Hero MVP env.ts — Twoslash-highlighted, tabbed by validator.
 */
export async function HeroMvpExample() {
	const examples = await highlightHeroMvpExamples();
	return <HeroMvpExampleView examples={examples} />;
}

export function HeroMvpExampleSlot() {
	return (
		<Suspense fallback={<HeroMvpExampleFallback />}>
			<HeroMvpExample />
		</Suspense>
	);
}
