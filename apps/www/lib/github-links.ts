import { env } from "~/env";

/**
 * Canonical public GitHub repo URL for www chrome CTAs.
 */
export const GITHUB_REPO_URL = env.NEXT_PUBLIC_GITHUB_URL;

/**
 * Canonical public GitHub repo URL for www chrome CTAs.
 * @deprecated Access `env.NEXT_PUBLIC_GITHUB_URL` directly.
 */
export function getGithubRepoUrl(): string {
	return GITHUB_REPO_URL;
}

/**
 * GitHub issues list for the public repo.
 */
export function getGithubIssuesUrl(): string {
	return `${GITHUB_REPO_URL}/issues`;
}

/**
 * Prefill a docs feedback Discussion title from the current page.
 */
export function getGithubDocsFeedbackUrl(pageTitle: string): string {
	const url = new URL(`${GITHUB_REPO_URL}/discussions/new`);
	url.searchParams.set("category", "docs-feedback");
	url.searchParams.set("title", `Docs feedback: ${pageTitle}`);
	return url.toString();
}
