import { WindowChrome } from "./window-chrome";

export const AUTOCOMPLETE_COPY = `import { env } from "./env";

const db = env.DATABASE_URL;
const port = env.PORT;
`;

/**
 * Editor DX: VS Code mock with env autocomplete hanging off env.|
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
					Strictly typed
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Strict type inference without glue code. Your schema is the single
					source of truth.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window home-aurora__ide"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				role="img"
				aria-label="VS Code autocomplete on env, suggesting DATABASE_URL as a string"
			>
				<WindowChrome title="./app.ts" copyText={AUTOCOMPLETE_COPY} />
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
								<span className="home-aurora__ide-caret-slot">
									<span className="home-aurora__tok-caret" aria-hidden="true" />
									<ul
										className="home-aurora__ide-menu nd-copy-ignore"
										aria-hidden="true"
									>
										<li data-active="true">
											<span className="home-aurora__ide-name">
												DATABASE_URL
											</span>
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
								</span>
								{"\n"}
								<span className="home-aurora__tok-kw">const</span>
								{" port = "}
								<span className="home-aurora__tok-id">env</span>
								<span className="home-aurora__tok-punct">.</span>
								<span className="home-aurora__tok-id">PORT</span>
								{";"}
							</code>
						</pre>
					</div>
				</div>
			</figure>
		</section>
	);
}
