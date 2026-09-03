/**
 * Machine-readable validation errors for CI and agents.
 */
const PROOF_JSON = `{
  "success": false,
  "issues": [
    { "path": "HOST", "code": "MISSING_VARIABLE", "message": "must be a string or \\"localhost\\" (was missing)" },
    { "path": "PORT", "code": "INVALID_TYPE", "message": "must be a number (was a string)" }
  ]
}`;

export function RuntimeBloatShowcase() {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-errors"
			id="errors"
		>
			<header className="home-aurora__pitch-head">
				<h2 id="home-errors" data-reveal="blur">
					Errors you can automate
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Beautiful errors in the terminal. Structured JSON for CI and agents.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window home-aurora__terminal"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="JSON from arkenv check --json with HOST MISSING_VARIABLE and PORT INVALID_TYPE"
			>
				<pre className="home-aurora__tty">
					<code>
						<span
							className="home-aurora__install-prompt-symbol"
							aria-hidden="true"
						>
							{"$"}
						</span>
						{" arkenv check --json\n\n"}
						{PROOF_JSON}
					</code>
				</pre>
				<figcaption>
					<code>HOST</code> <code>MISSING_VARIABLE</code>
					{" → add it to "}
					<code>.env</code>
					{"; "}
					<code>PORT</code> <code>INVALID_TYPE</code>
					{" → fix the value, don't touch the schema."}
				</figcaption>
			</figure>
		</section>
	);
}
