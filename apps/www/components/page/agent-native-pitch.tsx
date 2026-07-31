import { WindowChrome } from "./window-chrome";

/**
 * Agent-native pitch: terminal CLI + Cursor-style agent transcript in a frame.
 */
export function AgentNativePitch() {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-agent"
			id="agents"
		>
			<header className="home-aurora__pitch-head">
				<p className="home-aurora__pitch-label" data-reveal="fade">
					05 - AGENTIC
				</p>
				<h2 id="home-agent" data-reveal="blur">
					For humans and{" "}
					<span className="home-aurora__digital">their agents</span>.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Run the interactive CLI, or point the agent skill at your{" "}
					<code>.env</code> in Cursor, Claude Code, or Codex.
				</p>
			</header>

			<div
				className="home-aurora__agent-split"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				<figure className="home-aurora__terminal">
					<WindowChrome title="zsh - arkenv" />
					<pre>
						<code>
							<span className="home-aurora__tok-muted">yam@dev</span>
							<span className="home-aurora__tok-punct">:</span>
							<span className="home-aurora__tok-ok">~/app</span>
							<span className="home-aurora__tok-muted">$</span> npx
							arkenv@latest init{"\n"}
							<span className="home-aurora__tok-ok">✔</span> Detected Next.js
							{"\n"}
							<span className="home-aurora__tok-ok">✔</span> Wrote{" "}
							<span className="home-aurora__tok-id">env.ts</span>
							{"\n"}
							<span className="home-aurora__tok-ok">✔</span> Wired{" "}
							<span className="home-aurora__tok-id">@arkenv/nextjs</span>
							{"\n"}
							<span className="home-aurora__tok-muted">yam@dev</span>
							<span className="home-aurora__tok-punct">:</span>
							<span className="home-aurora__tok-ok">~/app</span>
							<span className="home-aurora__tok-muted">$</span>
						</code>
					</pre>
				</figure>

				<div className="home-aurora__transcript">
					<p className="home-aurora__transcript-prompt">
						Set up <span className="home-aurora__tok-cmd">/arkenv</span> for my
						.env
					</p>
					<p className="home-aurora__transcript-status">Worked for 2.4s</p>
					<div className="home-aurora__transcript-reply">
						<p>
							Running <code>npx arkenv@latest init --agent</code>. Schema
							matches your .env keys; validation works from editor to runtime.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
