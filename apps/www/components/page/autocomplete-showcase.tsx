import { WindowChrome } from "./window-chrome";

/**
 * Editor DX: VS Code mock with env autocomplete.
 */
export function AutocompleteShowcase() {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-autocomplete"
			id="autocomplete"
		>
			<header className="home-aurora__pitch-head">
				<h2 id="home-autocomplete" data-reveal="blur">
					Autocomplete everywhere.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Your editor knows exactly what&apos;s in your environment. Get perfect
					types without writing global namespace declarations.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window home-aurora__ide"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				role="img"
				aria-label="VS Code autocomplete on env, suggesting DATABASE_URL as a string"
			>
				<WindowChrome title="./app.ts" />
				<div className="home-aurora__ide-pane">
					<div className="home-aurora__ide-code">
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
					</div>
				</div>
			</figure>
		</section>
	);
}
