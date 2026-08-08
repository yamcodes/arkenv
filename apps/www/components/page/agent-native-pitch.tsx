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
					05 / AGENT-READY
				</p>
				<h2 id="home-agent" data-reveal="blur">
					For humans.{" "}
					<span className="home-aurora__digital">And their agents.</span>
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Run the interactive CLI, or point the{" "}
					<a
						href="/docs/guides/ai"
						className="underline decoration-cyan-500/40 underline-offset-4 hover:decoration-cyan-400"
					>
						agent skill
					</a>{" "}
					at your <code>.env.example</code> in Cursor, Claude Code, or Codex.
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
						Set up{" "}
						<a
							href="/docs/guides/ai"
							className="home-aurora__tok-cmd hover:underline"
						>
							/arkenv
						</a>{" "}
						for my .env.example
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
