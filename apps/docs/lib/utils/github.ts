/**
 * Breaks down a GitHub URL into its component parts
 * @param githubUrl - Optional GitHub repository URL. If not provided, uses NEXT_PUBLIC_GITHUB_URL from environment
 * @returns Object containing owner, repo name, and default branch
 * @throws {Error} If URL is not configured or has invalid format
 */
export const breakDownGithubUrl = (githubUrl?: string) => {
	const url = githubUrl ?? process.env.NEXT_PUBLIC_GITHUB_URL;
	if (!url) throw new Error("NEXT_PUBLIC_GITHUB_URL is not configured");
	const defaultBranch = process.env.NEXT_PUBLIC_GITHUB_BRANCH ?? "main";
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
	const url = githubUrl ?? process.env.NEXT_PUBLIC_GITHUB_URL;
	if (!url) throw new Error("NEXT_PUBLIC_GITHUB_URL is not configured");
	const { owner, repo, defaultBranch } = breakDownGithubUrl(url);
	const title = `Editing ${repo}/${path} at ${defaultBranch} · ${owner}/${repo}`;
	const href = `${url}/edit/${defaultBranch}/${path}`;
	return { title, href };
};
