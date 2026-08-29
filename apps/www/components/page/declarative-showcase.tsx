import { WindowChrome } from "./window-chrome";

export const DECLARATIVE_COPY = `// Before: presence check helper
const { PORT, DEBUG } = getEnv();
// PORT: string, DEBUG: string

// After: ArkEnv schema
import { env } from "./env";
const { PORT, DEBUG } = env;
// PORT: number, DEBUG: boolean
`;

/**
 * Declarative coercion & types showcase.
 * Contrasts a presence check helper with typed env coercion.
 */
export function DeclarativeShowcase() {
	return (
		<section
			className="home-aurora__pitch home-aurora__pitch--span"
			aria-labelledby="home-declarative"
			id="declarative"
		>
			<header className="home-aurora__pitch-head">
				<div className="home-aurora__pitch-badge-wrap" data-reveal="blur">
					<span className="home-aurora__pitch-badge">Zero-Config Coercion</span>
				</div>
				<h2 id="home-declarative" data-reveal="blur">
					Zero-config coercion
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Turn raw environment strings into typed booleans and numbers
					automatically, without manual casting.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="Before and after comparison of env helper vs ArkEnv coercion"
			>
				<WindowChrome title="./app.ts" copyText={DECLARATIVE_COPY} />
				<div className="home-aurora__ide-pane">
					<pre className="home-aurora__ide-body">
						<code>
							<span className="home-aurora__tok-comment">
								{"// Before: presence check helper\n"}
							</span>
							<span className="home-aurora__tok-kw">const</span>
							{" { "}
							<span className="home-aurora__tok-id">PORT</span>
							{", "}
							<span className="home-aurora__tok-id">DEBUG</span>
							{" } = "}
							<span className="home-aurora__tok-fn">getEnv</span>
							{"();\n"}
							<span className="home-aurora__tok-comment">{"// PORT: "}</span>
							<span className="home-aurora__type-dull">string</span>
							<span className="home-aurora__tok-comment">{", DEBUG: "}</span>
							<span className="home-aurora__type-dull">string</span>
							{"\n\n"}
							<span className="home-aurora__tok-comment">
								{"// After: ArkEnv schema\n"}
							</span>
							<span className="home-aurora__tok-kw">import</span>
							{" { "}
							<span className="home-aurora__tok-id">env</span>
							{" } "}
							<span className="home-aurora__tok-kw">from</span>
							<span className="home-aurora__tok-str">{` "./env"`}</span>
							{";\n"}
							<span className="home-aurora__tok-kw">const</span>
							{" { "}
							<span className="home-aurora__tok-id">PORT</span>
							{", "}
							<span className="home-aurora__tok-id">DEBUG</span>
							{" } = "}
							<span className="home-aurora__tok-id">env</span>
							{";\n"}
							<span className="home-aurora__tok-comment">{"// PORT: "}</span>
							<span className="home-aurora__type-vibrant">number</span>
							<span className="home-aurora__tok-comment">{", DEBUG: "}</span>
							<span className="home-aurora__type-vibrant">boolean</span>
						</code>
					</pre>
				</div>
			</figure>
		</section>
	);
}
