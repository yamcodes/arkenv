/**
 * Boot-time safety: terminal with a compact ArkEnvError dump.
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
					Fail-fast at boot
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Missing or malformed variables shouldn&apos;t silently crash
					production. ArkEnv fails loudly and early.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window home-aurora__terminal home-aurora__terminal--boot"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				role="img"
				aria-label="Terminal running npm run dev, then an ArkEnvError dump"
			>
				<pre className="home-aurora__tty">
					<code>
						<span
							className="home-aurora__install-prompt-symbol"
							aria-hidden="true"
						>
							{"$"}
						</span>
						{" npm run dev\n\n"}
						{"ArkEnvError: "}
						<span className="home-aurora__tty-err">
							Errors found while validating environment variables
						</span>
						{"\n  "}
						<span className="home-aurora__tty-key">DATABASE_URL</span>
						{" must be a URL string (was "}
						<span className="home-aurora__tty-val">[REDACTED]</span>
						{")\n  "}
						<span className="home-aurora__tty-key">PORT</span>
						{" must be a number (was "}
						<span className="home-aurora__tty-val">a string</span>
						{")"}
					</code>
				</pre>
			</figure>
		</section>
	);
}
