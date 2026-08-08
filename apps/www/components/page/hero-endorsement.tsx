import Image from "next/image";

/**
 * Hero social proof — Colin McDonnell's quote from a private email, used with permission.
 * Hallmark T3 · Single huge quote — full-bleed proof strip with portrait attribution.
 */
export function HeroEndorsement() {
	return (
		<figure className="home-aurora__endorsement">
			<blockquote>
				<p>
					Cool project
					<br />
					btw! <span className="home-aurora__endorsement-thumb">👍</span>
				</p>
			</blockquote>
			<figcaption className="home-aurora__endorsement-attr">
				<Image
					src="/assets/colin-mcdonnell.jpg"
					alt=""
					width={112}
					height={112}
					className="home-aurora__endorsement-avatar"
				/>
				<div className="home-aurora__endorsement-meta">
					<span className="home-aurora__endorsement-name">Colin McDonnell</span>
					<a
						href="https://zod.dev"
						target="_blank"
						rel="noopener noreferrer"
						className="home-aurora__endorsement-role"
					>
						Creator of Zod
					</a>
				</div>
			</figcaption>
		</figure>
	);
}
