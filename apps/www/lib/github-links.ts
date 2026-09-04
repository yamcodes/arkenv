import { env } from "~/env";

/**
 * Canonical public GitHub repo URL for www chrome CTAs.
 */
export function getGithubRepoUrl(): string {
	return env.NEXT_PUBLIC_GITHUB_URL;
}

/**
 * GitHub issues list for the public repo.
 */
export function getGithubIssuesUrl(): string {
	return `${getGithubRepoUrl()}/issues`;
}

/**
 * Prefill a docs feedback Discussion title from the current page.
 */
export function getGithubDocsFeedbackUrl(pageTitle: string): string {
	const url = new URL(`${getGithubRepoUrl()}/discussions/new`);
	url.searchParams.set("category", "docs-feedback");
	url.searchParams.set("title", `Docs feedback: ${pageTitle}`);
	return url.toString();
}
