/**
 * Agent-native split: CLI for humans, prompt/chat for LLMs.
 */
export function AgentNativePitch() {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-agent"
			id="agents"
		>
			<header className="home-aurora__pitch-head">
				<p className="home-aurora__pitch-label">03 — Agents</p>
				<h2 id="home-agent">Built for fingers and tokens</h2>
				<p>
					Manage schemas from an interactive CLI, or let your AI agent read and
					write them flawlessly.
				</p>
			</header>

			<div className="home-aurora__agent-split">
				<figure className="home-aurora__terminal">
					<figcaption>CLI</figcaption>
					<pre>
						<code>
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
							<span className="home-aurora__tok-muted">Ready.</span>
						</code>
					</pre>
				</figure>

				<figure className="home-aurora__chat">
					<figcaption>Agent</figcaption>
					<div className="home-aurora__chat-bubble home-aurora__chat-bubble--user">
						Set up ArkEnv from my .env — use --agent
					</div>
					<div className="home-aurora__chat-bubble home-aurora__chat-bubble--agent">
						Running <code>npx arkenv@latest init --agent</code>. Schema matches
						your .env keys; validation works from editor to runtime.
					</div>
				</figure>
			</div>
		</section>
	);
}
