import { HeroTwoslashHtml } from "./hero-twoslash-html";
import { WindowChrome } from "./window-chrome";

type BringYourOwnValidatorViewProps = {
	html: string;
	copyText: string;
};

/**
 * One mixed ArkType / Zod / Valibot schema. No validator tabs.
 */
export function BringYourOwnValidatorView({
	html,
	copyText,
}: BringYourOwnValidatorViewProps) {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-modular"
			id="modular"
		>
			<header className="home-aurora__pitch-head">
				<h2 id="home-modular" data-reveal="blur">
					Bring your own validator
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Use ArkType, Zod, Valibot, or any{" "}
					<a href="/docs/validating-your-environment/choosing-an-engine">
						Standard Schema
					</a>{" "}
					you already have. Mix and match for incremental migration.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				<WindowChrome title="./env.ts" copyText={copyText} />
				<HeroTwoslashHtml html={html} active />
			</figure>
		</section>
	);
}
