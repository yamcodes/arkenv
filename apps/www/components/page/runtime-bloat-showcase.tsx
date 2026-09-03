const HOST_MESSAGE = 'must be a string or "localhost" (was missing)';
const PORT_MESSAGE = "must be a number (was a string)";

const PROOF_JSON = `{
  "success": false,
  "issues": [
    { "path": "HOST", "code": "MISSING_VARIABLE", "message": "${HOST_MESSAGE}" },
    { "path": "PORT", "code": "INVALID_TYPE", "message": "${PORT_MESSAGE}" }
  ]
}`;

function EllipsisMessage({ message }: { message: string }) {
	return (
		<span className="home-aurora__json-ellipsis" title={message} tabIndex={0}>
			…
		</span>
	);
}

/**
 * Machine-readable validation errors for CI and agents.
 */
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
					Each issue gets a code that agents and CI can act on. Missing keys
					and bad values aren&apos;t the same.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window home-aurora__json"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="JSON issues for HOST missing and PORT invalid type"
			>
				<span className="home-aurora__json-lang" aria-hidden="true">
					json
				</span>
				<pre className="home-aurora__json-body home-aurora__tty--wrap">
					<code>
						{'{\n  "success": false,\n  "issues": [\n    { "path": "HOST", "code": "MISSING_VARIABLE", "message": "'}
						<EllipsisMessage message={HOST_MESSAGE} />
						{'" },\n    { "path": "PORT", "code": "INVALID_TYPE", "message": "'}
						<EllipsisMessage message={PORT_MESSAGE} />
						{'" }\n  ]\n}'}
					</code>
				</pre>
			</figure>
		</section>
	);
}
