/**
 * Simulated IDE autocomplete + Terminal fail-fast runtime output side-by-side.
 */
import { WindowChrome } from "./window-chrome";

export function TypeSafetyShowcase() {
	return (
		<section className="home-aurora__pitch" aria-labelledby="home-dx" id="dx">
			<header className="home-aurora__pitch-head">
				<p className="home-aurora__pitch-label" data-reveal="fade">
					02 / TYPESAFE
				</p>
				<h2 id="home-dx" data-reveal="blur">
					Editor autocomplete with fail-fast at runtime.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Your editor gets perfect types. ArkEnv rejects missing or invalid keys
					at build or startup, before they reach production.
				</p>
			</header>

			<div
				className="home-aurora__typesafe-split"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				<figure
					className="home-aurora__code-window home-aurora__ide"
					role="img"
					aria-label="IDE showing env autocomplete"
				>
					<WindowChrome title="./app.ts" />
					<pre className="home-aurora__ide-body">
						<code>
							<span className="home-aurora__tok-kw">import</span>
							{" { "}
							<span className="home-aurora__tok-id">env</span>
							{" } "}
							<span className="home-aurora__tok-kw">from</span>
							<span className="home-aurora__tok-str">{` "./env"`}</span>
							{";\n\n"}
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
							<span className="home-aurora__ide-name">CI</span>
							<span className="home-aurora__ide-type">boolean</span>
						</li>
					</ul>
				</figure>

				<figure className="home-aurora__code-window home-aurora__terminal">
					<WindowChrome title="node server.js" />
					<div className="home-aurora__fail">
						<div className="home-aurora__fail-banner">
							<span className="home-aurora__fail-chip">Runtime Error</span>
							<span className="home-aurora__fail-meta">Process Exited (1)</span>
						</div>
						<p className="home-aurora__fail-title">
							ArkEnvError: Errors found while validating environment variables
						</p>
						<div className="home-aurora__fail-stack">
							<p>
								<span className="home-aurora__fail-key">DATABASE_URL</span> must
								be a valid URL starting with postgresql:// or mysql:// (was
								&quot;localhost/db&quot;)
							</p>
							<p>
								<span className="home-aurora__fail-key">PORT</span> must be an
								integer between 0 and 65535 (was &quot;8080a&quot;)
							</p>
						</div>
					</div>
				</figure>
			</div>
		</section>
	);
}
