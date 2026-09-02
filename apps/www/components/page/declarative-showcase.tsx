/**
 * Automatic coercion showcase.
 * Minimalist 2-row Payload Pipeline:
 * - Row 1 (PORT=): Alternates between valid ("3000" -> 3000 number) and invalid ("oops" -> stuck at "number" -> error).
 * - Row 2 (DEBUG=): Alternates between true ("true" -> true boolean) and false ("false" -> false boolean).
 */
export function DeclarativeShowcase() {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-declarative"
			id="declarative"
		>
			<header className="home-aurora__pitch-head">
				<h2 id="home-declarative" data-reveal="blur">
					Automatic coercion
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Raw environment variables turn into booleans, numbers, and enums based
					on your schema.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__stream-widget"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="Payload pipeline showing valid strings coerced into primitives and invalid strings caught at the schema gate"
			>
				<div className="home-aurora__stream-stage">
					{/* Row 1: PORT= (alternates between valid "3000" and invalid "oops") */}
					<div className="home-aurora__payload-row home-aurora__payload-row--port">
						{/* Left static key */}
						<div className="home-aurora__payload-col home-aurora__payload-col--left">
							<span className="home-aurora__payload-key">PORT=</span>
						</div>

						{/* Mobile: Direct Wire (single track without middle gate) */}
						<div
							className="home-aurora__payload-wire home-aurora__payload-wire--direct"
							aria-hidden="true"
						>
							<svg
								className="home-aurora__stream-wire-svg"
								viewBox="0 0 100 20"
								preserveAspectRatio="none"
								aria-hidden="true"
							>
								<line
									x1="0"
									y1="10"
									x2="92"
									y2="10"
									className="home-aurora__stream-wire-track"
								/>
								<polygon
									points="90,7 98,10 90,13"
									className="home-aurora__stream-arrow"
								/>
							</svg>
							<div className="home-aurora__payload-carrier home-aurora__payload-carrier--port">
								<span className="home-aurora__payload-val home-aurora__payload-val--raw">
									&quot;3000&quot;
								</span>
								<span className="home-aurora__payload-val home-aurora__payload-val--coerced">
									3000
								</span>
							</div>
						</div>

						{/* Desktop: Wire 1 */}
						<div
							className="home-aurora__payload-wire home-aurora__payload-wire--1"
							aria-hidden="true"
						>
							<svg
								className="home-aurora__stream-wire-svg"
								viewBox="0 0 100 20"
								preserveAspectRatio="none"
								aria-hidden="true"
							>
								<line
									x1="0"
									y1="10"
									x2="100"
									y2="10"
									className="home-aurora__stream-wire-track"
								/>
							</svg>
							<span className="home-aurora__payload-chip home-aurora__payload-chip--port-valid">
								&quot;3000&quot;
							</span>
							<span className="home-aurora__payload-chip home-aurora__payload-chip--port-invalid">
								&quot;oops&quot;
							</span>
						</div>

						{/* Center Schema Gate */}
						<div className="home-aurora__payload-gate">
							<code className="home-aurora__payload-schema">
								&quot;number&quot;
							</code>
						</div>

						{/* Wire 2 */}
						<div
							className="home-aurora__payload-wire home-aurora__payload-wire--2"
							aria-hidden="true"
						>
							<svg
								className="home-aurora__stream-wire-svg"
								viewBox="0 0 100 20"
								preserveAspectRatio="none"
								aria-hidden="true"
							>
								<line
									x1="0"
									y1="10"
									x2="92"
									y2="10"
									className="home-aurora__stream-wire-track"
								/>
								<polygon
									points="90,7 98,10 90,13"
									className="home-aurora__stream-arrow"
								/>
							</svg>
							<span className="home-aurora__payload-chip home-aurora__payload-chip--port-coerced">
								3000
							</span>
						</div>

						{/* Right destination dock */}
						<div className="home-aurora__payload-col home-aurora__payload-col--right">
							<code className="home-aurora__payload-dock">number</code>
						</div>
					</div>

					{/* Row 2: DEBUG= (alternates between "true" and "false" boolean coercion) */}
					<div className="home-aurora__payload-row home-aurora__payload-row--debug">
						{/* Left static key */}
						<div className="home-aurora__payload-col home-aurora__payload-col--left">
							<span className="home-aurora__payload-key">DEBUG=</span>
						</div>

						{/* Mobile: Direct Wire (single track without middle gate) */}
						<div
							className="home-aurora__payload-wire home-aurora__payload-wire--direct"
							aria-hidden="true"
						>
							<svg
								className="home-aurora__stream-wire-svg"
								viewBox="0 0 100 20"
								preserveAspectRatio="none"
								aria-hidden="true"
							>
								<line
									x1="0"
									y1="10"
									x2="92"
									y2="10"
									className="home-aurora__stream-wire-track"
								/>
								<polygon
									points="90,7 98,10 90,13"
									className="home-aurora__stream-arrow"
								/>
							</svg>
							<div className="home-aurora__payload-carrier home-aurora__payload-carrier--debug-true">
								<span className="home-aurora__payload-val home-aurora__payload-val--raw">
									&quot;true&quot;
								</span>
								<span className="home-aurora__payload-val home-aurora__payload-val--coerced">
									true
								</span>
							</div>
							<div className="home-aurora__payload-carrier home-aurora__payload-carrier--debug-false">
								<span className="home-aurora__payload-val home-aurora__payload-val--raw">
									&quot;false&quot;
								</span>
								<span className="home-aurora__payload-val home-aurora__payload-val--coerced">
									false
								</span>
							</div>
						</div>

						{/* Wire 1 */}
						<div
							className="home-aurora__payload-wire home-aurora__payload-wire--1"
							aria-hidden="true"
						>
							<svg
								className="home-aurora__stream-wire-svg"
								viewBox="0 0 100 20"
								preserveAspectRatio="none"
								aria-hidden="true"
							>
								<line
									x1="0"
									y1="10"
									x2="100"
									y2="10"
									className="home-aurora__stream-wire-track"
								/>
							</svg>
							<span className="home-aurora__payload-chip home-aurora__payload-chip--debug-true">
								&quot;true&quot;
							</span>
							<span className="home-aurora__payload-chip home-aurora__payload-chip--debug-false">
								&quot;false&quot;
							</span>
						</div>

						{/* Center Schema Gate */}
						<div className="home-aurora__payload-gate">
							<code className="home-aurora__payload-schema">
								&quot;boolean&quot;
							</code>
						</div>

						{/* Wire 2 */}
						<div
							className="home-aurora__payload-wire home-aurora__payload-wire--2"
							aria-hidden="true"
						>
							<svg
								className="home-aurora__stream-wire-svg"
								viewBox="0 0 100 20"
								preserveAspectRatio="none"
								aria-hidden="true"
							>
								<line
									x1="0"
									y1="10"
									x2="92"
									y2="10"
									className="home-aurora__stream-wire-track"
								/>
								<polygon
									points="90,7 98,10 90,13"
									className="home-aurora__stream-arrow"
								/>
							</svg>
							<span className="home-aurora__payload-chip home-aurora__payload-chip--debug-true-coerced">
								true
							</span>
							<span className="home-aurora__payload-chip home-aurora__payload-chip--debug-false-coerced">
								false
							</span>
						</div>

						{/* Right destination dock */}
						<div className="home-aurora__payload-col home-aurora__payload-col--right">
							<code className="home-aurora__payload-dock">boolean</code>
						</div>
					</div>
				</div>
			</figure>
		</section>
	);
}
