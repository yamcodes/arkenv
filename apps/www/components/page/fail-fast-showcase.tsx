/**
 * Boot-time safety: terminal with a real ArkEnvError dump.
 */
export function FailFastShowcase() {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-boot"
			id="boot"
		>
			<header className="home-aurora__pitch-head">
				<h2 id="home-boot" data-reveal="blur">
					Fail fast at boot.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					A missing variable shouldn&apos;t cause a silent production crash.
					Catch configuration errors before the server even starts.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window home-aurora__terminal home-aurora__terminal--boot"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				role="img"
				aria-label="Terminal running npm run dev, then an ArkEnvError dump"
			>
				<div className="home-aurora__tty-chrome">
					<span className="home-aurora__tty-pill">
						<span className="home-aurora__tty-glyph" aria-hidden="true">
							{">_"}
						</span>
						npm run dev
					</span>
				</div>
				<pre className="home-aurora__tty">
					<code>
						<span className="home-aurora__tty-ok">ready</span>
						{" - started server on 0.0.0.0:3000, url: http://localhost:3000\n"}
						<span className="home-aurora__tty-info">info</span>
						{"  - loaded env from .env\n\n"}
						<span className="home-aurora__tty-err">ArkEnvError</span>
						{": Errors found while validating environment variables\n"}
						{"  "}
						<span className="home-aurora__tty-key">DATABASE_URL</span>
						{" must be a URL string (was "}
						<span className="home-aurora__tty-val">[REDACTED]</span>
						{")\n"}
						{"  "}
						<span className="home-aurora__tty-key">PORT</span>
						{" must be a number (was a string)"}
					</code>
				</pre>
			</figure>
		</section>
	);
}
