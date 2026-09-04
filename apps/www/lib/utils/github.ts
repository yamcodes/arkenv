import { env } from "~/env";

/**
 * Prefer the first non-empty trimmed string; treat "" as unset.
 */
function firstNonEmpty(
	...values: Array<string | undefined | null>
): string | undefined {
	for (const value of values) {
		const trimmed = value?.trim();
		if (trimmed) return trimmed;
	}
	return undefined;
}

/**
 * Breaks down a GitHub URL into its component parts
 * @param githubUrl - Optional GitHub repository URL. If not provided, uses NEXT_PUBLIC_GITHUB_URL from environment
 * @returns Object containing owner, repo name, and default branch
 * @throws {Error} If URL is not configured or has invalid format
 */
export const breakDownGithubUrl = (githubUrl?: string) => {
	const url =
		firstNonEmpty(githubUrl, env.NEXT_PUBLIC_GITHUB_URL) ??
		"https://github.com/yamcodes/arkenv";

	// Manual override → Vercel deploy branch → local/default.
	// Empty env values (common when vars are defined but blank) must not win over fallbacks.
	const defaultBranch =
		firstNonEmpty(env.NEXT_PUBLIC_GITHUB_BRANCH, env.VERCEL_GIT_COMMIT_REF) ??
		"dev";
	const cleanUrl = url.replace(/\/$/, "");
	const urlObj = new URL(cleanUrl);
	const [owner, repo] = urlObj.pathname.split("/").filter(Boolean).slice(-2);
	if (!owner || !repo) throw new Error("Invalid GitHub URL format");
	return { owner, repo, defaultBranch };
};

/**
 * Generates a title and href for editing a file in GitHub
 * @param path - File path within the repository
 * @param githubUrl - Optional GitHub repository URL
 * @returns Object containing title and href for the GitHub edit page
 * @throws {Error} If URL is not configured or has invalid format
 */
export const getLinkTitleAndHref = (path: string, githubUrl?: string) => {
	const url =
		firstNonEmpty(githubUrl, env.NEXT_PUBLIC_GITHUB_URL) ??
		"https://github.com/yamcodes/arkenv";

	const { owner, repo, defaultBranch } = breakDownGithubUrl(url);
	const cleanUrl = url.replace(/\/$/, "");
	const cleanPath = path.replace(/^\/+/, "");
	const title = `Editing ${repo}/${cleanPath} at ${defaultBranch} · ${owner}/${repo}`;
	const href = `${cleanUrl}/edit/${defaultBranch}/${cleanPath}`;
	return { title, href };
};
