const KNOWN_GITHUB_HANDLES: Record<string, string> = {
	"yam borodetsky": "yamcodes",
	yamcodes: "yamcodes",
};

/**
 * Resolves a GitHub username from explicit frontmatter, inline handle, or known author map.
 */
export function getAuthorGithub(
	author: string,
	explicitGithub?: string,
): string | undefined {
	if (explicitGithub && explicitGithub.trim().length > 0) {
		return explicitGithub.trim().replace(/^@/, "");
	}
	const handleMatch = author.match(/@([a-zA-Z0-9-]+)/);
	if (handleMatch) {
		return handleMatch[1];
	}
	const normalized = author.trim().toLowerCase();
	return KNOWN_GITHUB_HANDLES[normalized];
}

/**
 * Returns a direct GitHub avatar image URL.
 */
export function getAuthorAvatarUrl(githubHandle: string, size = 64): string {
	return `https://github.com/${githubHandle}.png?size=${size}`;
}
