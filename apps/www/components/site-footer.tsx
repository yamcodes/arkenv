import { DiscordListItem } from "~/components/discord-list-item";
import { Logo } from "~/components/page/logo";
import { getGithubRepoUrl } from "~/lib/github-links";

/**
 * Shared site footer used on the home page and docs.
 * Structure matches the home aurora footer (Ft5).
 */
export function SiteFooter({
	className,
	reveal = false,
}: {
	className?: string;
	/** Enable home-page scroll-reveal attribute. */
	reveal?: boolean;
}) {
	const githubRepoUrl = getGithubRepoUrl();

	return (
		<footer
			className={className ?? "home-aurora__footer"}
			{...(reveal ? { "data-reveal": "fade" as const } : {})}
		>
			<div className="home-aurora__footer-grid">
				<div className="home-aurora__footer-brand">
					<a href="/" className="home-aurora__wordmark" aria-label="ArkEnv home">
						<Logo />
					</a>
					<p>The simple way to validate environment variables.</p>
				</div>

				<nav aria-labelledby="footer-resources">
					<h3 id="footer-resources">Resources</h3>
					<ul>
						<li>
							<a
								href="https://stackblitz.com/github/yamcodes/arkenv/tree/main/examples/stackblitz?file=index.ts"
								target="_blank"
								rel="noopener noreferrer"
							>
								Live demo
							</a>
						</li>
						<li>
							<a
								href={`${githubRepoUrl}/releases`}
								target="_blank"
								rel="noopener noreferrer"
							>
								Releases
							</a>
						</li>
						<li>
							<a href="/docs">Docs</a>
						</li>
						<li>
							<a href="/#faq">FAQ</a>
						</li>
					</ul>
				</nav>

				<nav aria-labelledby="footer-integrations">
					<h3 id="footer-integrations">Integrations</h3>
					<ul>
						<li>
							<a href="/docs/getting-started/editor-integration">IDE</a>
						</li>
						<li>
							<a href="/docs/reference/init">Terminal</a>
						</li>
						<li>
							<a
								href="https://arktype.io/docs/ecosystem#arkenv"
								target="_blank"
								rel="noopener noreferrer"
							>
								ArkType
							</a>
						</li>
						<li>
							<a href="/docs/core-concepts/standard-schema">Standard Schema</a>
						</li>
					</ul>
				</nav>

				<nav aria-labelledby="footer-elsewhere">
					<h3 id="footer-elsewhere">Elsewhere</h3>
					<ul>
						<li>
							<a href={githubRepoUrl} target="_blank" rel="noopener noreferrer">
								GitHub
							</a>
						</li>
						<li>
							<a
								href="https://www.npmjs.com/package/@arkenv/core"
								target="_blank"
								rel="noopener noreferrer"
							>
								npm
							</a>
						</li>
						<li>
							<a
								href="https://www.skills.sh/yamcodes/arkenv/arkenv"
								target="_blank"
								rel="noopener noreferrer"
							>
								Skills
							</a>
						</li>
						<li>
							<a
								href="https://x.com/_yamcodes"
								target="_blank"
								rel="noopener noreferrer"
							>
								X
							</a>
						</li>
						<DiscordListItem />
					</ul>
				</nav>
			</div>

			<div className="home-aurora__footer-meta">
				<span>
					Free and open-source under the{" "}
					<a
						href={`${githubRepoUrl}/blob/dev/LICENSE`}
						target="_blank"
						rel="noopener noreferrer"
					>
						MIT License
					</a>
				</span>
				<span>
					© 2025-present{" "}
					<a href="https://yam.codes" target="_blank" rel="noopener noreferrer">
						Yam Borodetsky
					</a>
				</span>
			</div>
		</footer>
	);
}
