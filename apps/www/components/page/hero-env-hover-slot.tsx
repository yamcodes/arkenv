import { Suspense } from "react";
import { extractEnvHoverHtml } from "./extract-hero-env-hover";
import { HeroEnvHover } from "./hero-env-hover";
import { highlightHeroMvpExamples } from "./highlight-hero-twoslash";

async function HeroEnvHoverReady() {
	const examples = await highlightHeroMvpExamples();
	const hovers = examples.map((example) => ({
		host: example.host,
		validator: example.validator,
		html: extractEnvHoverHtml(example.html),
	}));
	return <HeroEnvHover hovers={hovers} />;
}

export function HeroEnvHoverSlot() {
	return (
		<Suspense fallback={<code>env</code>}>
			<HeroEnvHoverReady />
		</Suspense>
	);
}
