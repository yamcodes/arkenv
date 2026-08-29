import { DiscordListItem } from "~/components/discord-list-item";
import { Logo } from "~/components/page/logo";
import { getGithubRepoUrl } from "~/lib/github-links";

/**
 * Shared site footer used on the home page and docs.
 * Brand blurb + Resources, Validators, Frameworks, Elsewhere.
 */
export function SiteFooter({
	className,
	reveal = false,
	rails = false,
}: {
	className?: string;
	/**
	 * Enable home-page scroll-reveal attribute.
	 */
	reveal?: boolean;
	/**
	 * Docs cage: outer verticals continue through the footer. Home omits this —
	 * its rails already live on `.home-aurora__shell`.
	 */
	rails?: boolean;
}) {
	const githubRepoUrl = getGithubRepoUrl();

	const footer = (
		<footer
			className={className ?? "home-aurora__footer"}
			{...(reveal ? { "data-reveal": "fade" as const } : {})}
		>
			<div className="home-aurora__footer-grid">
				<div className="home-aurora__footer-brand">
					<a
						href="/"
						className="home-aurora__wordmark"
						aria-label="ArkEnv home"
					>
						<Logo />
					</a>
					<p>
						Typesafe environment variables with ArkType, Zod, Valibot, or any
						Standard Schema.
					</p>
				</div>

				<nav aria-labelledby="footer-resources">
					<h3 id="footer-resources">Resources</h3>
					<ul>
						<li>
							<a href="/docs">Docs</a>
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
							<a href="/docs/comparison">Comparison</a>
						</li>
						<li>
							<a href="/docs/faq">FAQ</a>
						</li>
					</ul>
				</nav>

				<nav aria-labelledby="footer-validators">
					<h3 id="footer-validators">Validators</h3>
					<ul>
						<li>
							<a href="/docs/guides/validators/arktype">ArkType</a>
						</li>
						<li>
							<a href="/docs/guides/validators/zod">Zod</a>
						</li>
						<li>
							<a href="/docs/guides/validators/valibot">Valibot</a>
						</li>
						<li>
							<a href="/docs/validating-your-environment/choosing-an-engine">Standard Schema</a>
						</li>
					</ul>
				</nav>

				<nav aria-labelledby="footer-frameworks">
					<h3 id="footer-frameworks">Frameworks</h3>
					<ul>
						<li>
							<a href="/docs/guides/frameworks/nextjs">Next.js</a>
						</li>
						<li>
							<a href="/docs/guides/frameworks/vite">Vite</a>
						</li>
						<li>
							<a href="/docs/guides/frameworks/nuxt">Nuxt</a>
						</li>
						<li>
							<a href="/docs/getting-started">Vanilla TS</a>
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

	if (!rails) return footer;

	return (
		<div className="site-footer-bleed">
			<div className="docs-outer-rails" aria-hidden="true" />
			<div className="site-footer-band">{footer}</div>
		</div>
	);
}
