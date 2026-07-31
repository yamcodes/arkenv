/**
 * Simulated IDE autocomplete - proves typesafe env access without a video.
 */
import { WindowChrome } from "./window-chrome";

export function TypeSafetyShowcase() {
	return (
		<section className="home-aurora__pitch" aria-labelledby="home-dx" id="dx">
			<header className="home-aurora__pitch-head">
				<p className="home-aurora__pitch-label" data-reveal="fade">
					02 - TYPESAFE
				</p>
				<h2 id="home-dx" data-reveal="blur">
					Editor autocomplete with fail-fast at runtime.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Your editor gets the types. ArkEnv rejects missing keys at build or
					startup, before they reach production.
				</p>
			</header>

			<div
				className="home-aurora__ide"
				role="img"
				aria-label="IDE showing env autocomplete for DATABASE_URL and PORT"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				<WindowChrome title="app.ts" />
				<pre className="home-aurora__ide-body">
					<code>
						<span className="home-aurora__tok-kw">import</span>
						{" { "}
						<span className="home-aurora__tok-id">env</span>
						{" } "}
						<span className="home-aurora__tok-kw">from</span>
						<span className="home-aurora__tok-str">{` "./env"`}</span>
						{`;\n\n`}
						<span className="home-aurora__tok-kw">const</span>
						{" db = "}
						<span className="home-aurora__tok-id">env</span>
						<span className="home-aurora__tok-punct">.</span>
						<span className="home-aurora__tok-caret" aria-hidden="true" />
					</code>
				</pre>
				<ul className="home-aurora__ide-menu" aria-hidden="true">
					<li data-active="true">
						<span className="home-aurora__ide-name">DATABASE_URL</span>
						<span className="home-aurora__ide-type">string</span>
					</li>
					<li>
						<span className="home-aurora__ide-name">PORT</span>
						<span className="home-aurora__ide-type">number</span>
					</li>
					<li>
						<span className="home-aurora__ide-name">NODE_ENV</span>
						<span className="home-aurora__ide-type">
							&quot;development&quot; | &quot;production&quot;
						</span>
					</li>
				</ul>
			</div>
		</section>
	);
}
