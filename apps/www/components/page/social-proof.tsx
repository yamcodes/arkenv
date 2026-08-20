import Image from "next/image";

/**
 * Colin McDonnell quote — the hero’s social proof, on its own so it can breathe.
 */
export function SocialProof() {
	return (
		<figure className="home-aurora__proof-quote">
			<Image
				src="/assets/colin-mcdonnell.png"
				alt=""
				width={96}
				height={96}
				className="home-aurora__proof-avatar"
			/>
			<div className="home-aurora__proof-quote-body">
				<blockquote>
					<p>&ldquo;Cool project btw! 👍&rdquo;</p>
				</blockquote>
				<figcaption>
					<span className="home-aurora__proof-name">Colin McDonnell</span>
					<span className="home-aurora__proof-role">Creator of Zod</span>
				</figcaption>
			</div>
		</figure>
	);
}
