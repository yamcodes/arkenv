import { SiZod } from "@icons-pack/react-simple-icons";

/**
 * Hero social proof — Colin McDonnell's quote, used with permission.
 * Typographic (no card) so it stays inside the Aurora intro composition.
 */
export function HeroEndorsement() {
	return (
		<figure className="home-aurora__endorsement">
			<p className="home-aurora__endorsement-from">From Colin McDonnell</p>
			<blockquote cite="https://zod.dev">
				<p>
					<span className="home-aurora__endorsement-mark" aria-hidden="true">
						“
					</span>
					Cool project btw!{" "}
					<span className="home-aurora__endorsement-thumb">👍</span>
					<span className="home-aurora__endorsement-mark" aria-hidden="true">
						”
					</span>
				</p>
			</blockquote>
			<figcaption className="home-aurora__endorsement-attr">
				<a
					href="https://zod.dev"
					target="_blank"
					rel="noopener noreferrer"
					className="home-aurora__endorsement-role"
				>
					<SiZod className="home-aurora__endorsement-zod" aria-hidden="true" />
					<span>Creator of Zod</span>
				</a>
			</figcaption>
		</figure>
	);
}
