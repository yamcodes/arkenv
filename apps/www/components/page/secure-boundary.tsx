import { SiTypescript } from "@icons-pack/react-simple-icons";
import { Lock } from "lucide-react";

/**
 * Client leak: Next.js Runtime Error overlay in a browser window.
 */
export function SecureBoundary() {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-secure"
			id="secure"
		>
			<header className="home-aurora__pitch-head">
				<h2 id="home-secure" data-reveal="blur">
					Full-stack ready
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Native integrations for modern frameworks. No server variables leak to
					the client bundle.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window home-aurora__browser"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				role="img"
				aria-label="Browser on localhost showing a Next.js Runtime Error for a client leak of DATABASE_URL"
			>
				<div className="home-aurora__browser-chrome">
					<span className="home-aurora__browser-lights" aria-hidden="true">
						<span />
						<span />
						<span />
					</span>
					<span className="home-aurora__browser-omnibox">
						<Lock
							className="home-aurora__browser-lock"
							aria-hidden="true"
							size={12}
							strokeWidth={2}
						/>
						localhost:3000
					</span>
					<span className="home-aurora__browser-end" aria-hidden="true" />
				</div>
				<div className="home-aurora__fail">
					<p className="home-aurora__fail-chip">Runtime Error</p>
					<p className="home-aurora__fail-title">
						Do not access server-only key &apos;DATABASE_URL&apos; on the client
						since it will leak sensitive data (prevented by ArkEnv)
					</p>
					<div className="home-aurora__fail-frame">
						<div className="home-aurora__fail-frame-head">
							<span className="home-aurora__window-icon" aria-hidden="true">
								<SiTypescript />
							</span>
							app/components/header.tsx (5:12) @ Header
						</div>
						<pre className="home-aurora__fail-frame-body">
							<code>
								<span className="home-aurora__fail-line home-aurora__fail-line--err">
									<span className="home-aurora__fail-gutter">5</span>
									<span className="home-aurora__fail-caret" aria-hidden="true">
										{">"}
									</span>
									{"    <span>{env.DATABASE_URL}</span>"}
								</span>
							</code>
						</pre>
					</div>
				</div>
			</figure>
		</section>
	);
}
