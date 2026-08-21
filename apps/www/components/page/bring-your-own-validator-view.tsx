import { HeroTwoslashHtml } from "./hero-twoslash-html";
import { WindowChrome } from "./window-chrome";

type BringYourOwnValidatorViewProps = {
	html: string;
};

/**
 * One mixed ArkType / Zod / Valibot schema. No validator tabs.
 */
export function BringYourOwnValidatorView({
	html,
}: BringYourOwnValidatorViewProps) {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-modular"
			id="modular"
		>
			<header className="home-aurora__pitch-head">
				<h2 id="home-modular" data-reveal="blur">
					Keep your existing validator.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Pass the ArkType, Zod, Valibot, or any{" "}
					<a href="/docs/core-concepts/standard-schema">Standard Schema</a> you
					already have, or mix and match for incremental migration.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				<WindowChrome title="./env.ts" />
				<HeroTwoslashHtml html={html} active className="home-aurora__shiki" />
			</figure>
		</section>
	);
}
