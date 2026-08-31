import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { WindowChrome } from "./window-chrome";

/**
 * FAQ pitch section addressing the 0-dep getEnv helper question.
 */
export function FaqSection() {
	return (
		<section className="home-aurora__pitch" aria-labelledby="home-faq" id="faq">
			<header className="home-aurora__pitch-head">
				<h2 id="home-faq" data-reveal="blur">
					Why not just write a getEnv helper?
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					A 12-line presence check helper is completely sufficient when all of
					your environment variables are required strings.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window home-aurora__faq-widget"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="Failure modes and graduation triggers when using a getEnv helper"
			>
				<WindowChrome
					title="./getEnv.ts failure cases"
					icon={
						<AlertTriangle
							className="home-aurora__faq-chrome-icon"
							size={13}
							aria-hidden="true"
						/>
					}
				/>

				<div className="sr-only">
					<p>Teams graduate to ArkEnv when their application introduces:</p>
					<ul>
						<li>
							Booleans: DEBUG=false in .env passes presence checks as a truthy
							string &quot;false&quot;.
						</li>
						<li>
							Numbers: PORT remains a string, turning port + 1 into string
							concatenation &quot;30001&quot;.
						</li>
						<li>
							Client/server splits: Hand-rolled helpers cannot enforce public
							prefixes or prevent secrets from leaking into browser bundles.
						</li>
					</ul>
				</div>

				<ul className="home-aurora__faq-inspect-list" aria-hidden="true">
					<li className="home-aurora__faq-inspect-item">
						<div className="home-aurora__faq-inspect-key">
							<span>Booleans:</span>
							<code className="home-aurora__faq-inspect-code">DEBUG=false</code>
						</div>
						<div className="home-aurora__faq-inspect-eval">
							<code>if (debug)</code> evaluates truthy
						</div>
						<span className="home-aurora__faq-inspect-badge home-aurora__faq-inspect-badge--warn">
							Truthy &quot;false&quot;
						</span>
					</li>
					<li className="home-aurora__faq-inspect-item">
						<div className="home-aurora__faq-inspect-key">
							<span>Numbers:</span>
							<code className="home-aurora__faq-inspect-code">PORT=3000</code>
						</div>
						<div className="home-aurora__faq-inspect-eval">
							<code>port + 1</code> evaluates <code>&quot;30001&quot;</code>
						</div>
						<span className="home-aurora__faq-inspect-badge home-aurora__faq-inspect-badge--danger">
							String concat
						</span>
					</li>
					<li className="home-aurora__faq-inspect-item">
						<div className="home-aurora__faq-inspect-key">
							<span>Client/server splits:</span>
							<code className="home-aurora__faq-inspect-code">
								STRIPE_SECRET
							</code>
						</div>
						<div className="home-aurora__faq-inspect-eval">
							<code>bundle.js</code> leaks server key
						</div>
						<span className="home-aurora__faq-inspect-badge home-aurora__faq-inspect-badge--danger">
							Client leak
						</span>
					</li>
				</ul>

				<div className="home-aurora__faq-footer">
					<Link
						href="/docs/guides/migrating-from-a-getenv-helper"
						className="home-aurora__faq-cta"
					>
						<span>Read the full getEnv migration guide</span>
						<ArrowRight
							className="home-aurora__faq-cta-arrow"
							size={14}
							strokeWidth={2}
							aria-hidden="true"
						/>
					</Link>
				</div>
			</figure>
		</section>
	);
}
