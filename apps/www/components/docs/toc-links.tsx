import { getGithubDocsFeedbackUrl, getGithubRepoUrl } from "~/lib/github-links";

/**
 * Quiet TOC actions: feedback + star. Passed as `tableOfContent.footer`.
 */
export function DocsTocLinks({ pageTitle }: { pageTitle: string }) {
	return (
		<div className="mt-6 flex flex-col gap-2 border-t border-fd-border pt-4 text-sm text-fd-muted-foreground">
			<a
				href={getGithubDocsFeedbackUrl(pageTitle)}
				target="_blank"
				rel="noopener noreferrer"
				className="hover:text-fd-foreground transition-colors"
			>
				Give feedback
			</a>
			<a
				href={getGithubRepoUrl()}
				target="_blank"
				rel="noopener noreferrer"
				className="hover:text-fd-foreground transition-colors"
			>
				Star on GitHub
			</a>
		</div>
	);
}
