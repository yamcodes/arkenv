import Image from "next/image";

/**
 * Hero social proof — Colin McDonnell's quote from a private email, used with permission.
 * Founder shout-out with avatar; no social-network chrome (it wasn't a public post).
 */
export function HeroEndorsement() {
	return (
		<figure className="home-aurora__endorsement">
			<div className="home-aurora__endorsement-card">
				<div className="home-aurora__endorsement-head">
					<Image
						src="/assets/colin-mcdonnell.jpg"
						alt=""
						width={44}
						height={44}
						className="home-aurora__endorsement-avatar"
					/>
					<div className="home-aurora__endorsement-meta">
						<span className="home-aurora__endorsement-name">
							Colin McDonnell
						</span>
						<a
							href="https://zod.dev"
							target="_blank"
							rel="noopener noreferrer"
							className="home-aurora__endorsement-role"
						>
							Creator of Zod
						</a>
					</div>
				</div>
				<blockquote>
					<p>
						Cool project btw!{" "}
						<span className="home-aurora__endorsement-thumb">👍</span>
					</p>
				</blockquote>
			</div>
		</figure>
	);
}
