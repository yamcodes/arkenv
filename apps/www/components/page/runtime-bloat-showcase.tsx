/**
 * Machine-readable validation errors for CI and agents.
 */
const PROOF_JSON = `{
  "success": false,
  "issues": [
    {
      "path": "HOST",
      "code": "MISSING_VARIABLE",
      "message": "must be a string or \\"localhost\\" (was missing)"
    },
    {
      "path": "PORT",
      "code": "INVALID_TYPE",
      "message": "must be a number (was a string)"
    }
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
					Structured errors
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Each issue gets an error code agents and CI can act on. Missing keys
					and bad values aren&apos;t the same.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window home-aurora__terminal"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				<pre className="home-aurora__tty home-aurora__tty--wrap">
					<code>{PROOF_JSON}</code>
				</pre>
			</figure>
		</section>
	);
}
