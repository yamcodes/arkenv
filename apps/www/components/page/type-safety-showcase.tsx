/**
 * Simulated IDE autocomplete — proves typesafe env access without a video.
 */
export function TypeSafetyShowcase() {
	return (
		<section className="home-aurora__pitch" aria-labelledby="home-dx" id="dx">
			<header className="home-aurora__pitch-head">
				<p className="home-aurora__pitch-label">02 — Typesafety</p>
				<h2 id="home-dx">Stop guessing your env vars</h2>
				<p>
					Full IDE autocomplete and type inference across your stack — from
					editor to runtime.
				</p>
			</header>

			<div
				className="home-aurora__ide"
				role="img"
				aria-label="IDE showing env autocomplete for DATABASE_URL and PORT"
			>
				<div className="home-aurora__ide-chrome">
					<span className="home-aurora__ide-dot" />
					<span className="home-aurora__ide-dot" />
					<span className="home-aurora__ide-dot" />
					<span className="home-aurora__ide-tab">app.ts</span>
				</div>
				<pre className="home-aurora__ide-body">
					<code>
						<span className="home-aurora__tok-kw">import</span>
						{" { env } "}
						<span className="home-aurora__tok-kw">from</span>
						{` "./env";\n\n`}
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
