import Image from "next/image";

/**
 * Hero social proof — Colin McDonnell's quote, used with permission.
 * Tweet-style shout-out (avatar + handle + casual line), not a corporate pull-quote.
 */
export function HeroEndorsement() {
	return (
		<a
			href="https://x.com/colinhacks"
			target="_blank"
			rel="noopener noreferrer"
			className="home-aurora__endorsement"
		>
			<figure className="home-aurora__endorsement-card">
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
						<span className="home-aurora__endorsement-handle">@colinhacks</span>
					</div>
					<svg
						className="home-aurora__endorsement-x"
						viewBox="0 0 24 24"
						aria-hidden="true"
						focusable="false"
					>
						<path
							fill="currentColor"
							d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"
						/>
					</svg>
				</div>
				<blockquote cite="https://x.com/colinhacks">
					<p>
						Cool project btw!{" "}
						<span className="home-aurora__endorsement-thumb">👍</span>
					</p>
				</blockquote>
				<figcaption className="home-aurora__endorsement-attr">
					Creator of Zod
				</figcaption>
			</figure>
		</a>
	);
}
