import Link from "next/link";

/**
 * FAQ pitch section addressing the 0-dep getEnv helper question.
 */
export function FaqSection() {
	return (
		<section
			className="home-aurora__pitch home-aurora__pitch--span home-aurora__faq"
			aria-labelledby="home-faq"
			id="faq"
		>
			<header className="home-aurora__pitch-head home-aurora__faq-head">
				<h2 id="home-faq" data-reveal="blur">
					Why not just write a getEnv helper?
				</h2>
				<p
					className="home-aurora__faq-intro"
					data-reveal
					style={{ ["--reveal-delay" as string]: "80ms" }}
				>
					A 12-line presence check helper is completely sufficient when all of
					your environment variables are required strings.
				</p>
			</header>

			<div
				className="home-aurora__faq-body"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				<p className="home-aurora__faq-lead">
					Teams graduate to ArkEnv when their application introduces:
				</p>
				<ul className="home-aurora__faq-triggers">
					<li>
						<strong>Booleans:</strong> <code>DEBUG=false</code> in{" "}
						<code>.env</code> passes presence checks as a truthy string (
						<code>&quot;false&quot;</code>).
					</li>
					<li>
						<strong>Numbers:</strong> <code>PORT</code> remains a string,
						turning <code>port + 1</code> into string concatenation (
						<code>&quot;30001&quot;</code>).
					</li>
					<li>
						<strong>Client/server splits:</strong> Hand-rolled helpers cannot
						enforce public prefixes or prevent secrets from leaking into browser
						bundles.
					</li>
				</ul>
				<div className="home-aurora__faq-action">
					<Link
						href="/docs/guides/migrating-from-a-getenv-helper"
						className="home-aurora__text-link home-aurora__faq-link"
					>
						Read the full getEnv migration guide →
					</Link>
				</div>
			</div>
		</section>
	);
}
